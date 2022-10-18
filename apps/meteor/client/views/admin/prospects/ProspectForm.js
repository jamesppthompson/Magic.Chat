import {
	Field,
	TextInput,
	TextAreaInput,
	PasswordInput,
	MultiSelectFiltered,
	Box,
	ToggleSwitch,
	Icon,
	Divider,
	FieldGroup,
} from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback, useMemo, useState } from 'react';

import { validateEmail } from '../../../../lib/emailValidator';
import CustomFieldsForm from '../../../components/CustomFieldsForm';
import VerticalBar from '../../../components/VerticalBar';

export default function ProspectForm({ formValues, formHandlers, append, prepend, errors, ...props }) {
	const t = useTranslation();
	const [hasCustomFields, setHasCustomFields] = useState(false);

	const {
		name,
		email,
		gender,
		phone,
		state,
		street,
		birth,
	} = formValues;

	const {
		handleName,
		handleGender,
		handleEmail,
		handlePhone,
		handleState,
		handleStreet,
		handleBirth,
	} = formHandlers;

	const onLoadCustomFields = useCallback((hasCustomFields) => setHasCustomFields(hasCustomFields), []);

	return (
		<VerticalBar.ScrollableContent {...props} is='form' onSubmit={useCallback((e) => e.preventDefault(), [])} autoComplete='off'>
			<FieldGroup>
				{prepend}
				{useMemo(
					() => (
						<Field>
							<Field.Label>{t('Name')}</Field.Label>
							<Field.Row>
								<TextInput error={errors && errors.name} flexGrow={1} value={name} onChange={handleName} />
							</Field.Row>
							{errors && errors.name && <Field.Error>{errors.name}</Field.Error>}
						</Field>
					),
					[t, name, handleName, errors],
				)}
				
				{useMemo(
					() => (
						<Field>
							<Field.Label>{t('Email')}</Field.Label>
							<Field.Row>
								<TextInput
									error={errors && errors.email}
									flexGrow={1}
									value={email}
									error={!validateEmail(email) && email.length > 0 ? 'error' : undefined}
									onChange={handleEmail}
									addon={<Icon name='mail' size='x20' />}
								/>
							</Field.Row>
							{errors && errors.email && <Field.Error>{errors.email}</Field.Error>}
						</Field>
					),
					[t, email, handleEmail, errors],
				)}
				{useMemo(
					() => (
						<Field>
							<Field.Label>{'Gender'}</Field.Label>
							<Field.Row>
								<TextInput error={errors && errors.gender} flexGrow={1} value={gender} onChange={handleGender} />
							</Field.Row>
							{errors && errors.gender && <Field.Error>{errors.gender}</Field.Error>}
						</Field>
					),
					[t, gender, handleGender, errors],
				)}
				{useMemo(
					() => (
						<Field>
							<Field.Label>{'Phone'}</Field.Label>
							<Field.Row>
								<TextInput error={errors && errors.phone} flexGrow={1} value={phone} onChange={handlePhone} />
							</Field.Row>
							{errors && errors.phone && <Field.Error>{errors.phone}</Field.Error>}
						</Field>
					),
					[t, phone, handlePhone, errors],
				)}
				{useMemo(
					() => (
						<Field>
							<Field.Label>{'Address'}</Field.Label>
							<Field.Row>
								<TextInput error={errors && errors.street} flexGrow={1} value={street} onChange={handleStreet} />
							</Field.Row>
							{errors && errors.street && <Field.Error>{errors.street}</Field.Error>}
						</Field>
					),
					[t, street, handleStreet, errors],
				)}
				{useMemo(
					() => (
						<Field>
							<Field.Label>{'CITY / STATE / ZIP'}</Field.Label>
							<Field.Row>
								<TextInput error={errors && errors.state} flexGrow={1} value={state} onChange={handleState} />
							</Field.Row>
							{errors && errors.state && <Field.Error>{errors.state}</Field.Error>}
						</Field>
					),
					[t, state, handleState, errors],
				)}
				{useMemo(
					() => (
						<Field>
							<Field.Label>{'DATE OF BIRTH'}</Field.Label>
							<Field.Row>
								<TextInput error={errors && errors.birth} flexGrow={1} value={birth} onChange={handleBirth} />
							</Field.Row>
							{errors && errors.birth && <Field.Error>{errors.birth}</Field.Error>}
						</Field>
					),
					[t, birth, handleBirth, errors],
				)}
				
				{append}
			</FieldGroup>
		</VerticalBar.ScrollableContent>
	);
}
