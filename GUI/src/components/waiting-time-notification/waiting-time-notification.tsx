import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useChatSelector from '../../hooks/use-chat-selector';
import styles from './waiting-time-notification.module.scss';
import Button, { ButtonColor } from '../button/button';
import formatTime from '../../utils/format-time';
import WaitingTimeNotificationForm from './waiting-time-notification-form';
import 'overlayscrollbars/css/OverlayScrollbars.css';
import '../chat-content/os-custom-theme.scss';
import NotificationMessage from './notification-message';
import { useAppDispatch } from '../../store';
import {
  getEstimatedWaitingTime,
  setEstimatedWaitingTimeToZero,
} from '../../slices/chat-slice';

const WaitingTimeNotification = (): JSX.Element => {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);

  const estimatedWaiting2 = {
    time: 300,
    isActive: true,
}

const FORMATTED_TIME = formatTime(estimatedWaiting2.time)

  return (
    <div className={styles.container}>
      <NotificationMessage showIcon={true}>
        {t('notifications.waiting-time')}{' '}
        {FORMATTED_TIME > 0 ? `${FORMATTED_TIME} ${t('widget.time.minutes')}` : `${FORMATTED_TIME} ${t('widget.time.minute')}`}
      </NotificationMessage>
      <NotificationMessage showIcon={false}>
        {t('notifications.ask-contact-information')}
      </NotificationMessage>
      <div className={styles.action}>
        <Button
          title={t('widget.action.yes')}
          color={ButtonColor.BLUE}
          onClick={() => setShowForm(true)}
        >
          {t('widget.action.yes')}
        </Button>
        <Button
          title={t('widget.action.no')}
          color={showForm === false ? ButtonColor.BLUE : ButtonColor.GRAY}
          onClick={() => setShowForm(false)}
        >
          {t('widget.action.no')}
        </Button>
      </div>
      {showForm && <WaitingTimeNotificationForm />}
    </div>
  );
};

export default WaitingTimeNotification;
