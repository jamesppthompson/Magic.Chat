import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { IUser } from '@rocket.chat/core-typings';
import type { Filter } from 'mongodb';
import { Users } from '@rocket.chat/models';
import type { Mongo } from 'meteor/mongo';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';

type UserAutoComplete = Required<Pick<IUser, '_id' | 'name' | 'username' | 'nickname' | 'status' | 'avatarETag'>>;
export async function findUsersToAutocomplete({
	uid,
	selector,
}: {
	uid: string;
	selector: {
		exceptions: string[];
		conditions: Filter<IUser>;
		term: string;
	};
}): Promise<{
	items: UserAutoComplete[];
}> {
	if (!(await hasPermissionAsync(uid, 'view-outside-room'))) {
		return { items: [] };
	}
	const exceptions = selector.exceptions || [];
	const conditions = selector.conditions || {};
	const options = {
		projection: {
			name: 1,
			username: 1,
			nickname: 1,
			status: 1,
			avatarETag: 1,
		},
		sort: {
			username: 1,
		},
		limit: 10,
	};

	const users = await Users.findActiveByUsernameOrNameRegexWithExceptionsAndConditions<UserAutoComplete>(
		new RegExp(escapeRegExp(selector.term), 'i'),
		exceptions,
		conditions,
		options,
	).toArray();

	return {
		items: users,
	};
}

/**
 * Returns a new query object with the inclusive fields only
 */
export function getInclusiveFields(query: Record<string, 1 | 0>): Record<string, 1> {
	const newQuery = Object.create(null);

	for (const [key, value] of Object.entries(query)) {
		if (value === 1) {
			newQuery[key] = value;
		}
	}

	return newQuery;
}

/**
 * get the default fields if **fields** are empty (`{}`) or `undefined`/`null`
 * @param fields the fields from parsed jsonQuery
 */
export function getNonEmptyFields(fields: Record<string, 1 | 0>): Record<string, 1 | 0> {
	const defaultFields = {
		name: 1,
		username: 1,
		emails: 1,
		roles: 1,
		status: 1,
		active: 1,
		avatarETag: 1,
		lastLogin: 1,
		type: 1,
	} as const;

	if (!fields || Object.keys(fields).length === 0) {
		return defaultFields;
	}

	return { ...defaultFields, ...fields };
}

/**
 * get the default query if **query** is empty (`{}`) or `undefined`/`null`
 * @param query the query from parsed jsonQuery
 */
export function getNonEmptyQuery<T extends IUser>(query: Mongo.Query<T> | undefined | null, canSeeAllUserInfo?: boolean): Mongo.Query<T> {
	const defaultQuery: Mongo.Query<IUser> = {
		$or: [{ username: { $regex: '', $options: 'i' } }, { name: { $regex: '', $options: 'i' } }],
	};

	if (canSeeAllUserInfo) {
		defaultQuery.$or?.push({ 'emails.address': { $regex: '', $options: 'i' } });
	}

	if (!query || Object.keys(query).length === 0) {
		return defaultQuery;
	}

	return { ...defaultQuery, ...query };
}
