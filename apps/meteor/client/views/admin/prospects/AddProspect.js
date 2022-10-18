import { Field, Box, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo, useCallback, useState } from 'react';

import { useEndpointAction } from '../../../hooks/useEndpointAction';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { useForm } from '../../../hooks/useForm';
import ProspectForm from './ProspectForm';

const AddProspect = ({ onReload, ...props }) => {
	const t = useTranslation();

	const router = useRoute('admin-prospects');

	const [errors, setErrors] = useState({});

	const validationKeys = {
		name: (name) =>
			setErrors((errors) => ({
				...errors,
				name: !name.trim().length ? t('The_field_is_required', t('name')) : undefined,
			})),
		
		email: (email) =>
			setErrors((errors) => ({
				...errors,
				email: !email.trim().length ? t('The_field_is_required', t('email')) : undefined,
			})),
	};

	const validateForm = ({ key, value, values }) => {
		validationKeys[key] && validationKeys[key](value, values);
	};

	const { values, handlers, reset, hasUnsavedChanges } = useForm(
		{
			name: '',
			email: '',
			gender: 'male',
			phone: '',
			street: '',
			state: '',
			birth: '',
		},
		validateForm,
	);

	const goToUser = useCallback(
		(id) =>
			router.push({
				context: 'info',
				id,
			}),
		[router],
	);

	const saveAction = useEndpointAction('POST', '/v1/users.create', values, t('User_created_successfully!'));
	const eventStats = useEndpointAction('POST', '/v1/statistics.telemetry', {
		params: [{ eventName: 'updateCounter', settingsId: 'Manual_Entry_User_Count' }],
	});

	const handleSave = useMutableCallback(async () => {
		Object.entries(values).forEach(([key, value]) => {
			validateForm({ key, value, values });
		});

		const { name, username, password, email, setRandomPassword } = values;
		if (name === '' || email === '') {
			return false;
		}
		

		const result = await saveAction();
		if (result.success) {
			eventStats();
			goToUser(result.user._id);
			onReload();
		}
	});

	const append = useMemo(
		() => (
			<Field>
				<Field.Row>
					<Box display='flex' flexDirection='row' justifyContent='space-between' w='full'>
						<Button flexGrow={1} disabled={!hasUnsavedChanges} onClick={reset} mie='x4'>
							{t('Cancel')}
						</Button>
						<Button flexGrow={1} disabled={!hasUnsavedChanges} onClick={handleSave}>
							{t('Save')}
						</Button>
					</Box>
				</Field.Row>
			</Field>
		),
		[hasUnsavedChanges, reset, t, handleSave],
	);

	return (
		<ProspectForm errors={errors} formValues={values} formHandlers={handlers} append={append} {...props} />
	);
};

export default AddProspect;
