import { useIntl } from '@edx/frontend-platform/i18n';
import {
  Icon,
  IconButton,
  Tab,
  Tabs,
} from '@openedx/paragon';
import {
  AccessTimeFilled,
  ArrowBack,
  Edit,
} from '@openedx/paragon/icons';

import { VisibilityTypes } from '@src/data/constants';
import { XBlock } from '@src/data/types';
import { InfoSidebarMenu, InfoSidebarMenuProps } from '@src/generic/sidebar/InfoSidebarMenu';

import messages from '../messages';

export interface ContextualFact {
  label: string;
  value: string;
}

interface ContextualInfoSidebarProps {
  item: XBlock;
  eyebrow: string;
  icon: React.ComponentType;
  summaryTitle: string;
  facts: ContextualFact[];
  settings: React.ReactNode;
  currentTabKey?: string;
  setCurrentTabKey: (tabKey: string | undefined) => void;
  onBack: () => void;
  menuProps: InfoSidebarMenuProps;
  publishAction?: React.ReactNode;
  summaryAction?: React.ReactNode;
}

const getState = (item: XBlock, formatMessage: ReturnType<typeof useIntl>['formatMessage']) => {
  if (item.visibilityState === VisibilityTypes.STAFF_ONLY) {
    return {
      key: 'staff',
      label: formatMessage(messages.contextStateStaffLabel),
      title: formatMessage(messages.contextStateStaffTitle),
      description: formatMessage(messages.contextStateStaffDescription),
    };
  }

  if (item.published && item.hasChanges) {
    return {
      key: 'draft',
      label: formatMessage(messages.contextStateModifiedLabel),
      title: formatMessage(messages.contextStateChangesTitle),
      description: formatMessage(messages.contextStateChangesDescription),
    };
  }

  if (item.releasedToStudents) {
    return {
      key: 'live',
      label: formatMessage(messages.contextStateLiveLabel),
      title: formatMessage(messages.contextStateLiveTitle),
      description: formatMessage(messages.contextStateLiveDescription),
    };
  }

  if (item.published) {
    return {
      key: 'scheduled',
      label: formatMessage(messages.contextStateScheduledLabel),
      title: formatMessage(messages.contextStateScheduledTitle),
      description: formatMessage(messages.contextStateScheduledDescription),
    };
  }

  return {
    key: 'draft',
    label: formatMessage(messages.contextStateDraftLabel),
    title: formatMessage(messages.contextStateDraftTitle),
    description: formatMessage(messages.contextStateDraftDescription),
  };
};

export const ContextualInfoSidebar = ({
  item,
  eyebrow,
  icon,
  summaryTitle,
  facts,
  settings,
  currentTabKey,
  setCurrentTabKey,
  onBack,
  menuProps,
  publishAction,
  summaryAction,
}: ContextualInfoSidebarProps) => {
  const intl = useIntl();
  const state = getState(item, intl.formatMessage);
  const activeTabKey = currentTabKey === 'settings' ? 'settings' : 'info';
  const publicationValue = item.publishedOn
    || item.releaseDate
    || item.start
    || intl.formatMessage(messages.contextPublicationUnscheduled);

  return (
    <div className="ws-context-sidebar__inner">
      <header className="ws-context-sidebar__header">
        <p className="ws-context-sidebar__eyebrow">{eyebrow}</p>
        <div className="ws-context-sidebar__title-row">
          <div className="ws-context-sidebar__title">
            <IconButton
              src={ArrowBack}
              alt={intl.formatMessage(messages.contextBackAction)}
              size="inline"
              onClick={onBack}
            />
            <Icon src={icon} aria-hidden />
            <h2>{item.displayName}</h2>
          </div>
          <div className="ws-context-sidebar__title-actions">
            <span className={`ws-context-sidebar__badge is-${state.key}`}>{state.label}</span>
            <InfoSidebarMenu {...menuProps} />
          </div>
        </div>
      </header>

      <Tabs
        variant="tabs"
        className="ws-context-sidebar__tabs"
        id={`context-sidebar-tabs-${item.id}`}
        activeKey={activeTabKey}
        onSelect={setCurrentTabKey}
        mountOnEnter
      >
        <Tab eventKey="info" title={intl.formatMessage(messages.contextSummaryTab)}>
          <div className="ws-context-sidebar__body">
            <section className="ws-context-sidebar__section">
              <h3>{intl.formatMessage(messages.contextStateSectionTitle)}</h3>
              <div className="ws-context-sidebar__state">
                <span className={`ws-context-sidebar__state-dot is-${state.key}`} aria-hidden />
                <div>
                  <strong>{state.title}</strong>
                  <p>{state.description}</p>
                </div>
              </div>
            </section>

            <section className="ws-context-sidebar__section">
              <h3>{intl.formatMessage(messages.contextActivitySectionTitle)}</h3>
              {item.editedOn && (
                <div className="ws-context-sidebar__activity-row">
                  <Icon src={Edit} aria-hidden />
                  <div>
                    <span>{intl.formatMessage(messages.contextLastModified)}</span>
                    <strong>{item.editedOn}</strong>
                  </div>
                </div>
              )}
              <div className="ws-context-sidebar__activity-row">
                <Icon src={AccessTimeFilled} aria-hidden />
                <div>
                  <span>{intl.formatMessage(messages.contextPublication)}</span>
                  <strong>{publicationValue}</strong>
                </div>
              </div>
              {publishAction}
            </section>

            <section className="ws-context-sidebar__section">
              <div className="ws-context-sidebar__section-heading">
                <h3>{summaryTitle}</h3>
                {summaryAction}
              </div>
              <dl className="ws-context-sidebar__facts">
                {facts.map(({ label, value }) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>
        </Tab>
        <Tab eventKey="settings" title={intl.formatMessage(messages.settingsTabText)}>
          <div className="ws-context-sidebar__settings">{settings}</div>
        </Tab>
      </Tabs>
    </div>
  );
};
