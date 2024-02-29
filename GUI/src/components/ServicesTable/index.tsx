import { FC, useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MdDeleteOutline, MdOutlineDescription, MdOutlineEdit } from "react-icons/md";
import { IoCopyOutline } from "react-icons/io5";
import { Button, Card, Icon, Label, Modal, Tooltip, Track } from "..";
import { Service } from "../../types/service";
import { ServiceState } from "../../types/service-state";
import DataTable from "../DataTable";

import "./ServicesTable.scss";
import useStore from "store/store";
import useServiceListStore from "store/services.store";
import { ROUTES } from "resources/routes-constants";
import useToastStore from "store/toasts.store";
import "../../styles/main.scss";
import ConnectServiceToIntentModel from "pages/Integration/ConnectServiceToIntentModel";
import { Intent } from "types/Intent";

type ServicesTableProps = {
  isCommon?: boolean;
};

const getLabelType = (serviceState: ServiceState) => {
  switch (serviceState) {
    case ServiceState.Draft:
      return "disabled";
    case ServiceState.Inactive:
      return "warning-dark";
    default:
      return "info";
  }
};

const ServicesTable: FC<ServicesTableProps> = ({ isCommon = false }) => {
  const { t } = useTranslation();
  const [isDeletePopupVisible, setDeletePopupVisible] = useState(false);
  const userInfo = useStore((state) => state.userInfo);
  const [isStatePopupVisible, setStatePopupVisible] = useState(false);
  const [isReadyPopupVisible, setReadyPopupVisible] = useState(false);
  const [isIntentConnectionPopupVisible, setIntentConnectionPopupVisible] = useState(false);
  const [popupText, setPopupText] = useState("");
  const [readyPopupText, setReadyPopupText] = useState("");
  const [isReadyStatusChecking, setReadyStatusChecking] = useState(false);
  const services = useServiceListStore((state) => state.services.filter((x) => x.isCommon === isCommon));
  const columnHelper = createColumnHelper<Service>();
  const navigate = useNavigate();

  const showStatePopup = (text: string) => {
    setPopupText(text);
    setStatePopupVisible(true);
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: t("overview.service.name") ?? "",
        meta: {
          size: 530,
        },
        cell: (props) => (
          <Track align="right" justify="start">
            <label style={{ paddingRight: 3 }}>{props.cell.getValue()}</label>
            <Tooltip
              content={
                <Track isMultiline={true}>
                  <label
                    style={{
                      fontSize: "15px",
                      maxWidth: "200px",
                      maxHeight: "200px",
                      overflow: "auto",
                      overflowWrap: "break-word",
                      wordWrap: "break-word",
                      wordBreak: "break-word",
                    }}
                  >
                    {props.row.original.description ?? ""}
                  </label>
                  <Button
                    appearance="text"
                    onClick={() => {
                      navigator.clipboard.writeText(props.row.original.description ?? "");
                      useToastStore.getState().success({
                        title: t("overview.descriptionCopiedSuccessfully"),
                      });
                    }}
                    style={{ paddingLeft: "5px" }}
                  >
                    <Icon style={{ color: "black" }} icon={<IoCopyOutline />} size="small" />
                  </Button>
                </Track>
              }
            >
              <div style={{ display: "inline-flex" }}>
                <Icon icon={<MdOutlineDescription />} size="medium" />
              </div>
            </Tooltip>
          </Track>
        ),
      }),
      columnHelper.accessor("usedCount", {
        header: t("overview.service.usedCount") ?? "",
        meta: {
          size: 320,
        },
      }),
      columnHelper.accessor("state", {
        header: t("overview.service.state") ?? "",
        meta: {
          size: 120,
        },
        cell: (props) => (
          <Track
            justify="around"
            onClick={() => {
              useServiceListStore.getState().setSelectedService(props.row.original);
              if (props.row.original.state === ServiceState.Ready) {
                checkIntentConnection();
                setReadyStatusChecking(true);
                setReadyPopupVisible(true);
              } else {
                showStatePopup(
                  t(
                    props.row.original.state === ServiceState.Draft
                      ? "overview.popup.setReady"
                      : props.row.original.state === ServiceState.Active
                      ? "overview.popup.setInactive"
                      : "overview.popup.setActive"
                  )
                );
              }
            }}
          >
            <Label type={getLabelType(props.row.original.state)}>
              {t(`overview.service.states.${props.row.original.state}`)}
            </Label>
          </Track>
        ),
      }),
      columnHelper.display({
        id: "edit",
        meta: {
          size: 90,
        },
        cell: (props) => (
          <Track align="right" justify="start">
            <Button
              appearance="text"
              disabled={
                isCommon === true && !userInfo?.authorities.includes("ROLE_ADMINISTRATOR")
                  ? true
                  : props.row.original.state === ServiceState.Active || props.row.original.state === ServiceState.Ready
              }
              onClick={() => navigate(ROUTES.replaceWithId(ROUTES.EDITSERVICE_ROUTE, props.row.original.serviceId))}
            >
              <Icon icon={<MdOutlineEdit />} size="medium" />
              {t("overview.edit")}
            </Button>
          </Track>
        ),
      }),
      columnHelper.display({
        id: "delete",
        meta: {
          size: 90,
        },
        cell: (props) => (
          <Track align="right">
            <Button
              disabled={
                isCommon === true && !userInfo?.authorities.includes("ROLE_ADMINISTRATOR")
                  ? true
                  : props.row.original.state === ServiceState.Active
              }
              appearance="text"
              onClick={() => {
                useServiceListStore.getState().setSelectedService(props.row.original);
                setDeletePopupVisible(true);
              }}
            >
              <Icon icon={<MdDeleteOutline />} size="medium" />
              {t("overview.delete")}
            </Button>
          </Track>
        ),
      }),
    ],
    []
  );

  const checkIntentConnection = () => {
    useServiceListStore.getState().checkServiceIntentConnection(
      () => {
        setReadyStatusChecking(false);
        setReadyPopupText(t("overview.popup.setActive").toString());
      },
      () => {
        setReadyStatusChecking(false);
        setReadyPopupText(t("overview.popup.intentNotConnected").toString());
      }
    );
  };

  const changeServiceState = (activate: boolean = false) => {
    useServiceListStore.getState().changeServiceState(
      () => {
        setReadyPopupVisible(false);
        setStatePopupVisible(false);
      },
      t("overview.service.toast.updated"),
      t("overview.service.toast.failed.state"),
      activate
    );
  };

  const deleteSelectedService = () => {
    useServiceListStore
      .getState()
      .deleteSelectedService(
        () => setDeletePopupVisible(false),
        t("overview.service.toast.deleted"),
        t("overview.service.toast.failed.delete")
      );
  };

  const requestServiceIntentConnection = (intent: string) => {
    useServiceListStore
      .getState()
      .requestServiceIntentConnection(
        () => setIntentConnectionPopupVisible(false),
        t("overview.service.toast.requestedConnection"),
        t("overview.service.toast.failed.requestConnection"),
        intent
      );
  };

  return (
    <Card>
      {isDeletePopupVisible && (
        <Modal title={t("overview.popup.delete")} onClose={() => setDeletePopupVisible(false)}>
          <Track justify="end" gap={16}>
            <Button appearance="secondary" onClick={() => setDeletePopupVisible(false)}>
              {t("overview.cancel")}
            </Button>
            <Button appearance="error" onClick={deleteSelectedService}>
              {t("overview.delete")}
            </Button>
          </Track>
        </Modal>
      )}
      {isStatePopupVisible && (
        <Modal title={popupText} onClose={() => setStatePopupVisible(false)}>
          <Track justify="end" gap={16}>
            <Button appearance="secondary" onClick={() => setStatePopupVisible(false)}>
              {t("overview.cancel")}
            </Button>
            <Button onClick={() => changeServiceState(false)}>{t("overview.popup.setState")}</Button>
          </Track>
        </Modal>
      )}
      {isReadyPopupVisible && (
        <Modal title={isReadyStatusChecking ? null : readyPopupText} onClose={() => setReadyPopupVisible(false)}>
          {isReadyStatusChecking ? (
            <Track justify="center" gap={16} direction="vertical">
              <label>{t("overview.popup.checking")}</label>
              <div className="loader" />
            </Track>
          ) : (
            <Track justify="end" gap={16}>
              <Button appearance="secondary" onClick={() => setReadyPopupVisible(false)}>
                {t("overview.cancel")}
              </Button>
              <Button onClick={() => changeServiceState(false)}>{t("overview.popup.setToDraft")}</Button>
              {readyPopupText === t("overview.popup.setActive") ? (
                <Button onClick={() => changeServiceState(true)}>{t("overview.popup.activateService")}</Button>
              ) : (
                <Button
                  onClick={() => {
                    setReadyPopupVisible(false);
                    setIntentConnectionPopupVisible(true);
                  }}
                >
                  {t("overview.popup.connectToIntent")}
                </Button>
              )}
            </Track>
          )}
        </Modal>
      )}
      {isIntentConnectionPopupVisible && (
        <ConnectServiceToIntentModel
          onModalClose={() => setIntentConnectionPopupVisible(false)}
          onConnect={(intent: Intent) => requestServiceIntentConnection(intent.intent)}
        />
      )}
      <DataTable sortable data={services} columns={columns} />
    </Card>
  );
};

export default ServicesTable;
