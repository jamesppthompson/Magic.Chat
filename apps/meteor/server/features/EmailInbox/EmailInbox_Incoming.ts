import stripHtml from 'string-strip-html';
import { Random } from 'meteor/random';
import type { ParsedMail, Attachment } from 'mailparser';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import type { ILivechatVisitor, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { OmnichannelSourceType } from '@rocket.chat/core-typings';
import { LivechatVisitors } from '@rocket.chat/models';

import { Livechat } from '../../../app/livechat/server/lib/Livechat';
import { LivechatRooms, Messages } from '../../../app/models/server';
import { FileUpload } from '../../../app/file-upload/server';
import { QueueManager } from '../../../app/livechat/server/lib/QueueManager';
import { settings } from '../../../app/settings/server';
import { logger } from './logger';

import { Meteor } from "meteor/meteor";
import { Accounts } from "meteor/accounts-base";
import s from "underscore.string";
import { Prospects } from "../../../app/models/server";
import {
  validateEmailDomain,
} from "../../../app/lib";




type FileAttachment = {
	title: string;
	title_link: string;
	image_url?: string;
	image_type?: string;
	image_size?: string;
	image_dimensions?: string;
	audio_url?: string;
	audio_type?: string;
	audio_size?: string;
	video_url?: string;
	video_type?: string;
	video_size?: string;
};

const language = settings.get<string>('Language') || 'en';
const t = (s: string): string => TAPi18n.__(s, { lng: language });

let userData = {
	name: "", // Name // string
	email: "", // string
	phone: "", // Phone  // strings
	prospectType: "",  // Type  // string
	location: "", // Location  // string
	street: "" , // Street Address  // string

	gender: "", // Gender // Male or Female
	birth: "", //Birthday // date - 08/19/1950
	height: "", // Height  // string
	weight: "", // Weight  // string
	tobacco: "", // Tobacco?  // No or Yes string
	relation: "", // Relation  // string


	maritalStatus: "", // Marital Status  // string
	preexistingConditions: "", // Pre-existing Conditions  // Yes or No string
	typeOfCondition: "", // Type of Condition  // string
	peopleInHousehold: "", // People in Household  // digits
	annualIncome: "", // Annual Income  // string

	selfEmployed: "", // self Employed  // Yes or No string
	qualifyingLifeEvent: "", // Qualifying Life Event  // Yes or No string
	expectantParent: "", // Expectant parent   // Yes or No string
	medications : "", // Medications // string
	healthOfCondition: "", // Health Conditions  // string
	deniedCoverage: "", // Denied Coverage in the Past 12 Months?  // Yes or No string
	treatedByPhysician: "", // Treated By Physician in the Past 12 Months?  // Yes or No string 
	planTypes: "", // Plan Types  // string
	optionalCoverage: "", // Optional Coverage  // string

	currentlyInsured: "",  // Currently Insured  // Yes or No string 
	policyExpires: "",  // Policy Expires  // string
	coveredFor: "",  // Covered For  // string
	currentProvider: "",  // Current Provider  // string
	
	type: "prospect",  // not show  // string
	leadVendor: "",
	campaign: "",
};

async function getGuestByEmail(email: string, name: string, department = ''): Promise<ILivechatVisitor | null> {
	logger.debug(`Attempt to register a guest for ${email} on department: ${department}`);
	const guest = await LivechatVisitors.findOneGuestByEmailAddress(email);

	if (guest) {
		logger.debug(`Guest with email ${email} found with id ${guest._id}`);
		if (guest.department !== department) {
			logger.debug({
				msg: 'Switching departments for guest',
				guest,
				previousDepartment: guest.department,
				newDepartment: department,
			});
			if (!department) {
				await LivechatVisitors.removeDepartmentById(guest._id);
				delete guest.department;
				return guest;
			}
			await Livechat.setDepartmentForGuest({ token: guest.token, department });
			return LivechatVisitors.findOneById(guest._id, {});
		}
		return guest;
	}

	logger.debug({
		msg: 'Creating a new Omnichannel guest for visitor with email',
		email,
	});
	const userId = await Livechat.registerGuest({
		token: Random.id(),
		name: name || email,
		email,
		department,
		phone: undefined,
		username: undefined,
		connectionData: undefined,
		id: undefined,
	});

	const newGuest = await LivechatVisitors.findOneById(userId);
	logger.debug(`Guest ${userId} for visitor ${email} created`);
	if (newGuest) {
		return newGuest;
	}

	throw new Error('Error getting guest');
}

async function uploadAttachment(attachment: Attachment, rid: string, visitorToken: string): Promise<FileAttachment> {
	const details = {
		name: attachment.filename,
		size: attachment.size,
		type: attachment.contentType,
		rid,
		visitorToken,
	};

	const fileStore = FileUpload.getStore('Uploads');
	return new Promise((resolve, reject) => {
		fileStore.insert(details, attachment.content, function (err: any, file: any) {
			if (err) {
				reject(new Error(err));
			}

			const url = FileUpload.getPath(`${file._id}/${encodeURI(file.name)}`);

			const attachment: FileAttachment = {
				title: file.name,
				title_link: url,
			};

			if (/^image\/.+/.test(file.type)) {
				attachment.image_url = url;
				attachment.image_type = file.type;
				attachment.image_size = file.size;
				attachment.image_dimensions = file.identify != null ? file.identify.size : undefined;
			}

			if (/^audio\/.+/.test(file.type)) {
				attachment.audio_url = url;
				attachment.audio_type = file.type;
				attachment.audio_size = file.size;
			}

			if (/^video\/.+/.test(file.type)) {
				attachment.video_url = url;
				attachment.video_type = file.type;
				attachment.video_size = file.size;
			}

			resolve(attachment);
		});
	});
}
async function email_parse_from_quotewizard(emailText: String) {
	// 1. email scraper, else return 0
	
  let position: number = emailText.indexOf("*Please do not respond to this email.Leads are sent from an unmonitored");
	if(position === -1) { console.log("quotewizard: scraper error"); return false; }

	// 2. email parser from emailText, return object
	
	// 2.1 find lead info in email content
	let fromPosition: number, toPosition: number, leadInfo: String 
	fromPosition = emailText.indexOf("Contact Information");
	toPosition = emailText.indexOf("Custom Lead Type Name : Exclusive")
	if(fromPosition === -1 || toPosition === -1) { console.log("quotewizard: lead error"); return false }

	leadInfo = emailText.slice(fromPosition, toPosition-1);
	// 2.2 add Lead info
	fromPosition = leadInfo.indexOf("NAME");
	toPosition = leadInfo.indexOf("EMAIL");
	if(fromPosition === -1 || toPosition === -1) { console.log("quotewizard: name error"); return false }
	userData.name = leadInfo.slice(fromPosition + 5, toPosition-1);

	fromPosition = leadInfo.indexOf("EMAIL");
	toPosition = leadInfo.indexOf("ADDRESS");
	if(fromPosition === -1 || toPosition === -1) { console.log("quotewizard: email error"); return false }
  	userData.email = s.trim((leadInfo.slice(fromPosition + 6, toPosition-1)).toLowerCase());

	fromPosition = leadInfo.indexOf("ADDRESS");
	toPosition = leadInfo.indexOf("PHONE");
	if(fromPosition === -1 || toPosition === -1) { console.log("quotewizard: address error"); return false }
	userData.street = leadInfo.slice(fromPosition + 8, toPosition-1);

	fromPosition = leadInfo.indexOf("PHONE");
	toPosition = leadInfo.indexOf("CITY / STATE / ZIP");
	if(fromPosition === -1 || toPosition === -1) { console.log("quotewizard: phone error"); return false }
	userData.phone = leadInfo.slice(fromPosition + 6, toPosition-1);

	fromPosition = leadInfo.indexOf("CITY / STATE / ZIP");
	toPosition = leadInfo.indexOf("Health Details");
	if(fromPosition === -1 || toPosition === -1) { console.log("quotewizard: state error"); return false }
	userData.location = leadInfo.slice(fromPosition + 19, toPosition-1); 

	fromPosition = leadInfo.indexOf("DATE OF BIRTH");
	toPosition = leadInfo.indexOf("GENDER");
	if(fromPosition === -1 || toPosition === -1) { console.log("quotewizard: date error"); return false }
	userData.birth = leadInfo.slice(fromPosition + 14, toPosition-1); 

	fromPosition = leadInfo.indexOf("GENDER");
	toPosition = leadInfo.indexOf("Coverage");
	if(fromPosition === -1 || toPosition === -1) { console.log("quotewizard: gender error"); return false }
	userData.gender = leadInfo.slice(fromPosition + 7, toPosition-1);

	fromPosition = leadInfo.indexOf("COVERAGE TYPE");
	toPosition = leadInfo.indexOf("IS MEDICARE");
	if(fromPosition === -1 || toPosition === -1) { console.log("quotewizard: coverage error"); return false }
	//userData.coverageType = leadInfo.slice(fromPosition + 14, toPosition-1);

	fromPosition = leadInfo.indexOf("IS MEDICARE");
	if(fromPosition === -1 ) { console.log("quotewizard: medicare error"); return false }
	//userData.isMedicare = leadInfo.slice(fromPosition + 12, fromPosition + 17) === "True" ? 1 : 0 ;

	userData.leadVendor = "Quote Wizard";
	return true;
}
async function email_content_parse(emailContent: ParsedMail) {

	// const emailText: String = new String(emailContent);
	const emailText: String = emailContent.text;
	console.log("======== email content =========", emailText);

	switch(1) {
		case 1:
			if( await email_parse_from_quotewizard(emailText) !== false ) break;
		default:
			return false;
	}
	
	// 3. Register in DB
 	console.log("<<<<<<< Prospect Info >>>>>>>>", userData)

	validateEmailDomain(userData.email);
  
	let userId;
	try {
		// Check if user has already been imported and never logged in. If so, set password and let it through
		const importedUser = Prospects.findOneByEmailAddress(userData.email);
		if (
			importedUser 
		) {
			// Accounts.setPassword(importedUser._id, userData.password);
			userId = importedUser._id;
		} else {
			userId = Prospects.create(userData);
		}
	} catch (e) {
		console.log("=========error message========", e.message);
	}

	return userId;
}

export async function onEmailReceived(email: ParsedMail, inbox: string, department = ''): Promise<void> {
  if(await email_content_parse(email)) return;

	logger.debug(`New email conversation received on inbox ${inbox}. Will be assigned to department ${department}`, email);
	if (!email.from?.value?.[0]?.address) {
		return;
	}

	const references = typeof email.references === 'string' ? [email.references] : email.references;
	const initialRef = [email.messageId, email.inReplyTo].filter(Boolean) as string[];
	const thread = (references?.length ? references : []).flatMap((t: string) => t.split(',')).concat(initialRef);

	logger.debug(`Received new email conversation with thread ${thread} on inbox ${inbox} from ${email.from.value[0].address}`);

	logger.debug(`Fetching guest for visitor ${email.from.value[0].address}`);
	const guest = await getGuestByEmail(email.from.value[0].address, email.from.value[0].name, department);

	if (!guest) {
		logger.debug(`No visitor found for ${email.from.value[0].address}`);
		return;
	}

	logger.debug(`Guest ${guest._id} obtained. Attempting to find or create a room on department ${department}`);

	let room: IOmnichannelRoom = LivechatRooms.findOneByVisitorTokenAndEmailThreadAndDepartment(guest.token, thread, department, {});

	logger.debug({
		msg: 'Room found for guest',
		room,
		guest,
	});

	if (room?.closedAt) {
		logger.debug(`Room ${room?._id} is closed. Reopening`);
		room = await QueueManager.unarchiveRoom(room);
	}

	let msg = email.text;

	if (email.html) {
		// Try to remove the signature and history
		msg = stripHtml(email.html.replace(/<div name="messageSignatureSection.+/s, '')).result;
	}

	const rid = room?._id ?? Random.id();
	const msgId = Random.id();

	logger.debug(`Sending email message to room ${rid} for visitor ${guest._id}. Conversation assigned to department ${department}`);

	Livechat.sendMessage({
		guest,
		message: {
			_id: msgId,
			groupable: false,
			msg,
			token: guest.token,
			attachments: [
				{
					actions: [
						{
							type: 'button',
							text: t('Reply_via_Email'),
							msg: 'msg',
							msgId,
							msg_in_chat_window: true,
							msg_processing_type: 'respondWithQuotedMessage',
						},
					],
				},
			],
			blocks: [
				{
					type: 'context',
					elements: [
						{
							type: 'mrkdwn',
							text: `**${t('From')}:** ${email.from.text}\n**${t('Subject')}:** ${email.subject}`,
						},
					],
				},
				{
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: msg,
					},
				},
			],
			rid,
			email: {
				thread,
				messageId: email.messageId,
			},
		},
		roomInfo: {
			email: {
				inbox,
				thread,
				replyTo: email.from.value[0].address,
				subject: email.subject,
			},
			source: {
				type: OmnichannelSourceType.EMAIL,
				id: inbox,
				alias: 'email-inbox',
			},
		},
		agent: undefined,
	})
		.then(async () => {
			if (!email.attachments.length) {
				return;
			}

			const attachments = [];
			for await (const attachment of email.attachments) {
				if (attachment.type !== 'attachment') {
					continue;
				}

				try {
					attachments.push(await uploadAttachment(attachment, rid, guest.token));
				} catch (e) {
					Livechat.logger.error('Error uploading attachment from email', e);
				}
			}

			Messages.update(
				{ _id: msgId },
				{
					$addToSet: {
						attachments: {
							$each: attachments,
						},
					},
				},
			);
			LivechatRooms.updateEmailThreadByRoomId(room._id, thread);
		})
		.catch((err) => {
			Livechat.logger.error({
				msg: 'Error receiving email',
				err,
			});
		});
}
