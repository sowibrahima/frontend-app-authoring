import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl, FormattedMessage } from '@edx/frontend-platform/i18n';
import {
  ActionRow,
  Button,
  DataTableContext,
  ModalDialog,
  useCheckboxSetValues,
} from '@openedx/paragon';
import messages from './messages';
import { getCheckedFilters, getFilterOptions, processFilters } from './utils';

const SortAndFilterModal = ({
  isSortOpen,
  closeSort,
  handleSort,
}) => {
  const intl = useIntl();
  const {
    state, setAllFilters, columns, gotoPage,
  } = useContext(DataTableContext);
  const filterOptions = getFilterOptions(columns);
  const currentFilters = getCheckedFilters(state);
  const [sortBy, setSortBy] = useState('dateAdded,desc');
  const [filterBy, {
    add, remove, set, clear,
  }] = useCheckboxSetValues(currentFilters);

  useEffect(() => {
    const updatedFilters = getCheckedFilters(state);
    set(updatedFilters);
  }, [state]);

  const handleChange = (e) => {
    setSortBy(e.target.value);
  };

  const handleFilterUpdate = (e) => {
    if (e.target.checked) {
      add(e.target.value);
    } else {
      remove(e.target.value);
    }
  };
  const handleApply = async () => {
    await handleSort(sortBy);
    processFilters(filterBy, columns, setAllFilters);
    gotoPage(0);
    closeSort();
  };

  const handleClearAll = () => {
    setSortBy('dateAdded,desc');
    clear();
  };

  const sortOptions = [
    {
      value: 'displayName,asc',
      label: intl.formatMessage(messages.sortByNameAscending),
      ariaLabel: intl.formatMessage(messages.sortByNameAscendingAriaLabel),
    },
    {
      value: 'dateAdded,desc',
      label: intl.formatMessage(messages.sortByNewest),
      ariaLabel: intl.formatMessage(messages.sortByNewestAriaLabel),
    },
    {
      value: 'fileSize,desc',
      label: intl.formatMessage(messages.sortBySizeDescending),
      ariaLabel: intl.formatMessage(messages.sortBySizeDescendingAriaLabel),
    },
    {
      value: 'displayName,desc',
      label: intl.formatMessage(messages.sortByNameDescending),
      ariaLabel: intl.formatMessage(messages.sortByNameDescendingAriaLabel),
    },
    {
      value: 'dateAdded,asc',
      label: intl.formatMessage(messages.sortByOldest),
      ariaLabel: intl.formatMessage(messages.sortByOldestAriaLabel),
    },
    {
      value: 'fileSize,asc',
      label: intl.formatMessage(messages.sortBySizeAscending),
      ariaLabel: intl.formatMessage(messages.sortBySizeAscendingAriaLabel),
    },
  ];

  return (
    <ModalDialog
      title={intl.formatMessage(messages.modalTitle)}
      isOpen={isSortOpen}
      onClose={closeSort}
      size="lg"
      hasCloseButton
      className="files-sort-filter-modal"
    >
      <ModalDialog.Header>
        <ModalDialog.Title>
          <FormattedMessage {...messages.modalTitle} />
        </ModalDialog.Title>
      </ModalDialog.Header>
      <ModalDialog.Body>
        <div className="h4 mb-4">
          <FormattedMessage {...messages.sortByHeader} />
        </div>
        <div
          className="files-sort-options"
          role="radiogroup"
          aria-label={intl.formatMessage(messages.sortByHeader)}
        >
          {sortOptions.map(({ value, label, ariaLabel }) => (
            <label
              className={`files-sort-option ${sortBy === value ? 'is-selected' : ''}`}
              key={value}
            >
              <input
                type="radio"
                value={value}
                checked={sortBy === value}
                onChange={handleChange}
                aria-label={ariaLabel}
              />
              {label}
            </label>
          ))}
        </div>
        <hr />
        <div className="h4 my-4">
          <FormattedMessage {...messages.filterByHeader} />
        </div>
        <div className="files-filter-options">
          {filterOptions.map(({ name, value }) => (
            <label className="files-filter-option" key={value}>
              <input
                type="checkbox"
                value={value}
                checked={filterBy.includes(value)}
                onChange={handleFilterUpdate}
              />
              {name}
            </label>
          ))}
        </div>
        <Button className="pl-0" variant="link" onClick={handleClearAll}>
          <FormattedMessage {...messages.clearAllButtonLabel} />
        </Button>
        <hr />
      </ModalDialog.Body>
      <ModalDialog.Footer>
        <ActionRow>
          <ModalDialog.CloseButton variant="tertiary">
            <FormattedMessage {...messages.cancelButtonLabel} />
          </ModalDialog.CloseButton>
          <Button
            variant="primary"
            onClick={handleApply}
          >
            <FormattedMessage {...messages.applySortButton} />
          </Button>
        </ActionRow>
      </ModalDialog.Footer>
    </ModalDialog>
  );
};

SortAndFilterModal.propTypes = {
  handleSort: PropTypes.func.isRequired,
  isSortOpen: PropTypes.bool.isRequired,
  closeSort: PropTypes.func.isRequired,
};

export default SortAndFilterModal;
