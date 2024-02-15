import { FC } from 'react';
import styles from './waiting-time-notification.module.scss';
import { useTranslation } from 'react-i18next';

interface Props {
  formData: {
    phone: string;
    email: string;
    message: string;
  };
}

const WaitingTImeNotificationFormSuccess: FC<Props> = ({
  formData: { phone, email, message },
}) => {
  const { t } = useTranslation();
  return (
    <div className={styles.form}>
      <table>
        <thead>
          <tr>
            <th>{t('widget.form.info')}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{phone}</td>
          </tr>
          <tr>
            <td>{email}</td>
          </tr>
          <tr>
            <td>{message}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default WaitingTImeNotificationFormSuccess;
