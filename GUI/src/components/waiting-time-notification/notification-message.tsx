import { Children, FC } from 'react';
import InfoIcon from './info-icon';
import styles from './waiting-time-notification.module.scss';

interface Props {
  showIcon: boolean;
  children: any;
}

const NotificationMessage: FC<Props> = ({ showIcon, children }) => {
  return (
    <div className={styles.messageContainer}>
      <div
        className={
          showIcon === true
            ? `${styles.infoIcon}`
            : `${styles.infoIcon} ${styles.hideIcon}`
        }
      >
        <InfoIcon />
      </div>
      <div className={`${styles.message}`}>
        <p>{children}</p>
      </div>
    </div>
  );
};

export default NotificationMessage;
