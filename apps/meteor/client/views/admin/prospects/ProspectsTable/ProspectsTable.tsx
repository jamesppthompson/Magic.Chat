import { States, StatesIcon, StatesTitle, Pagination } from '@rocket.chat/fuselage';
import { useMediaQuery, useDebouncedValue, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useMemo, MutableRefObject, useState, useEffect } from 'react';

import FilterByText from '../../../../components/FilterByText';
import {
	GenericTable,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableBody,
	GenericTableLoadingTable,
} from '../../../../components/GenericTable';
import { usePagination } from '../../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../../components/GenericTable/hooks/useSort';
import { useEndpointData } from '../../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../../lib/asyncState';
import ProspectsTableRow from './ProspectsTableRow';

type ProspectsTableProps = {
	reload: MutableRefObject<() => void>;
};

const ProspectsTable = ({ reload }: ProspectsTableProps): ReactElement | null => {
	const t = useTranslation();
	const prospectsRoute = useRoute('admin-prospects');
	const mediaQuery = useMediaQuery('(min-width: 1024px)');
	const [text, setText] = useState('');
	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();
	const { sortBy, sortDirection, setSort } = useSort<'name' | 'emails.address' >('name');

	const query = useDebouncedValue(
		useMemo(
			() => ({
				fields: JSON.stringify({
					name: 1,
					emails: 1,
					gender: 1,
					phone: 1,
					birth: 1,
				}),
				query: JSON.stringify({
					$or: [
						{ 'emails.address': { $regex: text || '', $options: 'i' } },
						{ name: { $regex: text || '', $options: 'i' } },
					],
				}),
				sort: `{ "${sortBy}": ${sortDirection === 'asc' ? 1 : -1} }`,
				count: itemsPerPage,
				offset: current,
			}),
			[text, itemsPerPage, current, sortBy, sortDirection],
		),
		500,
	);

	const { value, phase, reload: reloadList } = useEndpointData('/v1/users.list', query);

	useEffect(() => {
		reload.current = reloadList;
	}, [reload, reloadList]);

	const handleClick = useMutableCallback((id): void =>
		prospectsRoute.push({
			context: 'info',
			id,
		}),
	);

	const headers = useMemo(
		() => [
			<GenericTableHeaderCell w='x200' key='name' direction={sortDirection} active={sortBy === 'name'} onClick={setSort} sort='name'>
				{t('Name')}
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell
				w='x140'
				key='email'
				direction={sortDirection}
				active={sortBy === 'emails.address'}
				onClick={setSort}
				sort='emails.address'
			>
				{t('Email')}
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell
			w='x100'
			key='gender'
			direction={sortDirection}
			active={sortBy === 'gender'}
			onClick={setSort}
			sort='gender'
		>
			{'Gender'}
		</GenericTableHeaderCell>,
			mediaQuery && (
				<GenericTableHeaderCell w='x140' key='phone' direction={sortDirection} active={sortBy === 'phone'} onClick={setSort} sort='phone'>
					{'Phone'}
				</GenericTableHeaderCell>
			),
			<GenericTableHeaderCell w='x100' key='birth' direction={sortDirection} active={sortBy === 'birth'} onClick={setSort} sort='birth'>
				{'Birthday'}
			</GenericTableHeaderCell>,
		],
		[mediaQuery, setSort, sortBy, sortDirection, t],
	);

	if (phase === AsyncStatePhase.REJECTED) {
		return null;
	}

	return (
		<>
			<FilterByText placeholder={t('Search_Users')} onChange={({ text }): void => setText(text)} />
			{phase === AsyncStatePhase.LOADING && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>{phase === AsyncStatePhase.LOADING && <GenericTableLoadingTable headerCells={5} />}</GenericTableBody>
				</GenericTable>
			)}
			{value?.users && value.users.length > 0 && phase === AsyncStatePhase.RESOLVED && (
				<>
					<GenericTable>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{value?.users.map((user) => (
								user.type === "client" && <ProspectsTableRow key={user._id} onClick={handleClick} mediaQuery={mediaQuery} user={user} />
							))}
						</GenericTableBody>
					</GenericTable>
					<Pagination
						divider
						current={current}
						itemsPerPage={itemsPerPage}
						count={value?.total || 0}
						onSetItemsPerPage={onSetItemsPerPage}
						onSetCurrent={onSetCurrent}
						{...paginationProps}
					/>
				</>
			)}
			{phase === AsyncStatePhase.RESOLVED && value?.users.length === 0 && (
				<States>
					<StatesIcon name='magnifier' />
					<StatesTitle>{t('No_results_found')}</StatesTitle>
				</States>
			)}
		</>
	);
};

export default ProspectsTable;
