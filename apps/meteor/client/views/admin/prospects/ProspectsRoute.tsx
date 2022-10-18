import { usePermission } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import ProspectsPage from './ProspectsPage';

const ProspectsRoute = (): ReactElement => {
	const canViewUserAdministration = usePermission('view-user-administration');

	if (!canViewUserAdministration) {
		return <NotAuthorizedPage />;
	}

	return <ProspectsPage />;
};

export default ProspectsRoute;
