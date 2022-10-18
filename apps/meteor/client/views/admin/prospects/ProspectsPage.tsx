import { Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import { useRoute, useRouteParameter, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useEffect, ReactElement, useRef } from 'react';

import UserPageHeaderContentWithSeatsCap from '../../../../ee/client/views/admin/users/UserPageHeaderContentWithSeatsCap';
import { useSeatsCap } from '../../../../ee/client/views/admin/users/useSeatsCap';
import Page from '../../../components/Page';
import VerticalBar from '../../../components/VerticalBar';
import AddProspect from './AddProspect';
import AdminProspectInfoWithData from './AdminProspectInfoWithData';
import EditProspectWithData from './EditProspectWithData';
import ProspectsTable from './ProspectsTable';

const ProspectsPage = (): ReactElement => {
	const t = useTranslation();
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');
	const seatsCap = useSeatsCap();
	const reload = useRef(() => null);
	const prospectsRoute = useRoute('admin-prospects');

	useEffect(() => {
		if (!context || !seatsCap) {
			return;
		}

		if (seatsCap.activeUsers >= seatsCap.maxActiveUsers && !['edit', 'info'].includes(context)) {
			prospectsRoute.push({});
		}
	}, [context, seatsCap, prospectsRoute]);

	const handleCloseVerticalBar = (): void => {
		prospectsRoute.push({});
	};

	const handleNewProspect = (): void => {
		prospectsRoute.push({ context: 'new' });
	};


	const handleReload = (): void => {
		seatsCap?.reload();
		reload.current();
	};

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={'Prospects'}>
					{seatsCap && seatsCap.maxActiveUsers < Number.POSITIVE_INFINITY ? (
						<UserPageHeaderContentWithSeatsCap {...seatsCap} />
					) : (
						<ButtonGroup>
							{/* <Button onClick={handleNewProspect}>
								<Icon size='x20' name='user-plus' /> {t('New')}
							</Button> */}
						</ButtonGroup>
					)}
				</Page.Header>
				<Page.Content>
					<ProspectsTable reload={reload} />
				</Page.Content>
			</Page>
			{context && (
				<VerticalBar>
					<VerticalBar.Header>
						<VerticalBar.Text>
							{context === 'info' && 'Prospect Info'}
							{context === 'edit' && 'Edit Prospect'}
							{context === 'new' && 'Add Prospect'}
						</VerticalBar.Text>
						<VerticalBar.Close onClick={handleCloseVerticalBar} />
					</VerticalBar.Header>
					{context === 'info' && id && <AdminProspectInfoWithData uid={id} onReload={handleReload} />}
					{/* {context === 'edit' && id && <EditProspectWithData uid={id} onReload={handleReload} />} */}
					{/* {context === 'new' && <AddProspect onReload={handleReload} />} */}
				</VerticalBar>
			)}
		</Page>
	);
};

export default ProspectsPage;
