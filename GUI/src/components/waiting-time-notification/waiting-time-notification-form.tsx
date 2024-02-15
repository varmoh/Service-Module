import styles from './waiting-time-notification.module.scss';
import Button, { ButtonColor } from '../button/button';
import { useState } from 'react';
import WaitingTImeNotificationFormSuccess from './waiting-time-notification-form-success';
import NotificationMessage from './notification-message';
import { useTranslation } from 'react-i18next';

const WaitingTimeNotificationForm = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    message: '',
    sent: false,
  });

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormData({
      ...formData,
      sent: true,
    });
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  }

  return formData.sent === false ? (
    <form className={styles.form} onSubmit={handleFormSubmit}>
      <input
        type="phone"
        placeholder={t('widget.form.phone')}
        name="phone"
        value={formData.phone}
        onChange={(e) => handleChange(e)}
      />
      <input
        type="email"
        name="email"
        placeholder={t('widget.form.email')}
        value={formData.email}
        onChange={(e) => handleChange(e)}
      />
      <textarea
        rows={4}
        name="message"
        placeholder={t('widget.form.message')}
        value={formData.message}
        onChange={(e) => handleChange(e)}
      />
      <Button
        onClick={() => true}
        title="title"
        color={ButtonColor.BLUE}
        type="submit"
      >
{t('chat.feedback.button.label')}
      </Button>
    </form>
  ) : (
    <>
      <WaitingTImeNotificationFormSuccess formData={formData} />
      <NotificationMessage showIcon={true}>
      {t('widget.form.success')}
      </NotificationMessage>
    </>
  );
};

export default WaitingTimeNotificationForm;
