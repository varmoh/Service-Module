import { FC, useEffect, useMemo, useState } from "react";
import { createColumnHelper, PaginationState } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import { MdOutlineArrowForward } from "react-icons/md";
import useServiceStore from "store/services.store";
import { Button, DataTable, Dialog, FormInput, Icon, Track } from "components";
import { Intent } from "types/Intent";

type ConnectServiceToIntentModelProps = {
  onModalClose: () => void;
  onConnect: (intent: Intent) => void;
};

const ConnectServiceToIntentModel: FC<ConnectServiceToIntentModelProps> = ({ onModalClose, onConnect }) => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 8,
  });
  const [intents, setIntents] = useState<Intent[]>([]);

  const loadAvailableIntents = () => {
    useServiceStore
      .getState()
      .loadAvailableIntentsList(
        (requests: Intent[]) => setIntents(requests),
        t("connectionRequests.toast.failed.requests")
      );
  };

  useEffect(() => {
    loadAvailableIntents();
  }, []);

  const columnHelper = createColumnHelper<Intent>();

  const intentColumns = useMemo(
    () => [
      columnHelper.accessor("intent", {
        header: t("overview.popup.intent") || "",
      }),
      columnHelper.display({
        id: "connect",
        cell: (props) => (
          <Button appearance="text" onClick={() => onConnect(props.row.original)}>
            <Icon icon={<MdOutlineArrowForward color="rgba(0, 0, 0, 0.54)" />} />
            {t("overview.popup.connect")}
          </Button>
        ),
        meta: {
          size: "1%",
        },
      }),
    ],
    []
  );

  return (
    <Dialog title={t("overview.popup.connectServiceToIntent")} onClose={onModalClose} size="large">
      <Track
        direction="vertical"
        gap={8}
        style={{
          margin: "-16px -16px 0",
          padding: "16px",
          borderBottom: "1px solid #D2D3D8",
        }}
      >
        <FormInput
          label={t("overview.popup.searchIntents")}
          name="search"
          placeholder={t("overview.popup.searchIntents") + "..."}
          hideLabel
          onChange={(e) => setFilter(e.target.value)}
        />
      </Track>
      {intents && (
        <DataTable
          data={intents}
          columns={intentColumns}
          globalFilter={filter}
          setGlobalFilter={setFilter}
          sortable
          pagination={pagination}
          setPagination={setPagination}
        />
      )}
    </Dialog>
  );
};

export default ConnectServiceToIntentModel;
