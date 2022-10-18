import { IUser, Serialized } from '@rocket.chat/core-typings';
import { Box, Margins, Tag } from '@rocket.chat/fuselage';
import { TranslationKey, useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo, ReactElement, ReactNode } from 'react';

import { useTimeAgo } from '../../hooks/useTimeAgo';
import { useUserCustomFields } from '../../hooks/useUserCustomFields';
import { useUserDisplayName } from '../../hooks/useUserDisplayName';
import InfoPanel from '../InfoPanel';
import MarkdownText from '../MarkdownText';
import UTCClock from '../UTCClock';
import UserCard from '../UserCard';
import VerticalBar from '../VerticalBar';
import UserInfoAvatar from './UserInfoAvatar';

type UserInfoDataProps = Serialized<
	Pick<
		IUser,
		| 'name'
		| 'email'
		| 'gender'
		| 'phone'
		| 'state'
		| 'street'
		| 'birth'
	>
>;

type UserInfoProps = UserInfoDataProps & {
	status: ReactNode;
	email?: string;
	verified?: boolean;
	actions: ReactElement;
	roles: ReactElement[];
};

const UserInfo = ({
	name,
	email,
	gender,
	phone,
	state,
	street,
	birth,
	createdAt,
	...props
}: UserInfoProps): ReactElement => {
	const t = useTranslation();
	const timeAgo = useTimeAgo();

	return (
		<VerticalBar.ScrollableContent p='x24' {...props}>
			<InfoPanel>
				<InfoPanel.Section>
					{name && (
						<InfoPanel.Field>
							<InfoPanel.Label>{t('Full_Name')}</InfoPanel.Label>
							<InfoPanel.Text>{name}</InfoPanel.Text>
						</InfoPanel.Field>
					)}

					{email && (
						<InfoPanel.Field>
							<InfoPanel.Label>{t('Email')}</InfoPanel.Label>
							<InfoPanel.Text display='flex' flexDirection='row' alignItems='center'>
								<Box is='a' withTruncatedText href={`mailto:${email}`}>
									{email}
								</Box>
							</InfoPanel.Text>
						</InfoPanel.Field>
					)}

					{gender && (
						<InfoPanel.Field>
							<InfoPanel.Label>{'Gender'}</InfoPanel.Label>
							<InfoPanel.Text>{gender}</InfoPanel.Text>
						</InfoPanel.Field>
					)}
					{phone && (
						<InfoPanel.Field>
							<InfoPanel.Label>{t('Phone')}</InfoPanel.Label>
							<InfoPanel.Text display='flex' flexDirection='row' alignItems='center'>
								<Box is='a' withTruncatedText href={`tel:${phone}`}>
									{phone}
								</Box>
							</InfoPanel.Text>
						</InfoPanel.Field>
					)}
					{street && (
						<InfoPanel.Field>
							<InfoPanel.Label>{'Address'}</InfoPanel.Label>
							<InfoPanel.Text>{street}</InfoPanel.Text>
						</InfoPanel.Field>
					)}
					{state && (
						<InfoPanel.Field>
							<InfoPanel.Label>{'	CITY / STATE / ZIP'}</InfoPanel.Label>
							<InfoPanel.Text>{state}</InfoPanel.Text>
						</InfoPanel.Field>
					)}
					{birth && (
						<InfoPanel.Field>
							<InfoPanel.Label>{'DATE OF BIRTH'}</InfoPanel.Label>
							<InfoPanel.Text>{birth}</InfoPanel.Text>
						</InfoPanel.Field>
					)}
					


					{createdAt && (
						<InfoPanel.Field>
							<InfoPanel.Label>{t('Created_at')}</InfoPanel.Label>
							<InfoPanel.Text>{timeAgo(createdAt)}</InfoPanel.Text>
						</InfoPanel.Field>
					)}
				</InfoPanel.Section>
			</InfoPanel>
		</VerticalBar.ScrollableContent>
	);
};

export default memo(UserInfo);
