import { IUser } from '@rocket.chat/core-typings';
import { Callout } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetting, useRolesDescription, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo, ReactElement } from 'react';

import { getUserEmailAddress } from '../../../../lib/getUserEmailAddress';
import { FormSkeleton } from '../../../components/Skeleton';
import UserCard from '../../../components/UserCard';
import ProspectInfo from '../../../components/ProspectInfo';
import { UserStatus } from '../../../components/UserStatus';
import VerticalBar from '../../../components/VerticalBar';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { getUserEmailVerified } from '../../../lib/utils/getUserEmailVerified';
import AdminProspectInfoActions from './AdminProspectInfoActions';

type AdminProspectInfoWithDataProps = {
	uid: IUser['_id'];
	onReload: () => void;
};

const AdminProspectInfoWithData = ({ uid, onReload }: AdminProspectInfoWithDataProps): ReactElement => {
	const t = useTranslation();
	const approveManuallyUsers = useSetting('Accounts_ManuallyApproveNewUsers');

	const {
		value: data,
		phase: state,
		error,
		reload: reloadUserInfo,
	} = useEndpointData(
		'/v1/users.info',
		useMemo(() => ({ userId: uid }), [uid]),
	);
	const onChange = useMutableCallback(() => {
		onReload();
		reloadUserInfo();
	});

	const user = useMemo(() => {
		if (!data?.user) {
			return;
		}

		const {
			name,
			gender,
			phone,
			state,
			street,
			birth,
			createdAt,
		} = data.user;

		

		return {
			name,
			phone,
			state,
			street,
			birth,
			gender,
			email: getUserEmailAddress(data.user),
			createdAt,
		};
	}, [approveManuallyUsers, data]);

	if (state === AsyncStatePhase.LOADING) {
		return (
			<VerticalBar.Content>
				<FormSkeleton />
			</VerticalBar.Content>
		);
	}

	if (error || !user || !data?.user) {
		return (
			<VerticalBar.Content pb='x16'>
				<Callout type='danger'>{t('User_not_found')}</Callout>
			</VerticalBar.Content>
		);
	}

	return (
		<ProspectInfo
			{...user}
			actions={
				<AdminProspectInfoActions
					isActive={data?.user.active}
					isAdmin={data?.user.roles.includes('admin')}
					userId={data?.user._id}
					username={user.username}
					isAFederatedUser={data?.user.federated}
					onChange={onChange}
					onReload={onReload}
				/>
			}
		/>
	);
};

export default AdminProspectInfoWithData;
