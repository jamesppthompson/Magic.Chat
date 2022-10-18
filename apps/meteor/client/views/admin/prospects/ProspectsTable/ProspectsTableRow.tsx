import { IRole, IUser } from '@rocket.chat/core-typings';
import { Box, TableRow, TableCell } from '@rocket.chat/fuselage';
import { capitalize } from '@rocket.chat/string-helpers';
import { useTranslation, TranslationKey } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import { Roles } from '../../../../../app/models/client';

type ProspectsTableRowProps = {
	user: Pick<IUser, '_id' | 'name' | 'emails' | 'gender' | 'phone' | 'birth' | 'state' | 'street'>;
	onClick: (id: IUser['_id']) => void;
	mediaQuery: boolean;
};

const ProspectsTableRow = ({ user, onClick, mediaQuery }: ProspectsTableRowProps): ReactElement => {
	const t = useTranslation();
	const { _id, emails, name, gender, phone, birth, state, street } = user;

	return (
		<TableRow onKeyDown={(): void => onClick(_id)} onClick={(): void => onClick(_id)} tabIndex={0} role='link' action qa-user-id={_id}>
			<TableCell withTruncatedText>
				<Box display='flex' alignItems='center'>
					<Box display='flex' mi='x8' withTruncatedText>
						<Box display='flex' flexDirection='column' alignSelf='center' withTruncatedText>
							<Box fontScale='p2m' color='default' withTruncatedText>
								{name}
							</Box>
							{!mediaQuery && name && (
								<Box fontScale='p2' color='hint' withTruncatedText>
									{' '}
									{emails}
								</Box>
							)}
						</Box>
					</Box>
				</Box>
			</TableCell>
			<TableCell withTruncatedText>{emails?.length && emails[0].address}</TableCell>
			<TableCell withTruncatedText>{gender}</TableCell>
			<TableCell fontScale='p2' color='hint' withTruncatedText>{phone}</TableCell>
			<TableCell fontScale='p2' color='hint' withTruncatedText>{birth}</TableCell>
		</TableRow>
	);
};

export default ProspectsTableRow;
