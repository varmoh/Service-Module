import { create } from "zustand";
import axios from "axios";
import {
  changeIntentConnection,
  changeServiceStatus,
  deleteService as deleteServiceApi,
  getServicesList,
} from "resources/api-constants";
import { Service, ServiceState } from "types";
import useToastStore from "./toasts.store";

interface ServiceStoreState {
  services: Service[];
  commonServices: Service[];
  notCommonServices: Service[];
  loadServicesList: () => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  selectedService: Service | undefined;
  setSelectedService: (service: Service) => void;
  changeServiceState: (onEnd: () => void, successMessage: string, errorMessage: string) => Promise<void>;
  checkServiceIntentConnection: (onConnected: () => void, onNotConnected: () => void) => Promise<void>;
  deleteSelectedService: (onEnd: () => void, successMessage: string, errorMessage: string) => Promise<void>;
}

const useServiceListStore = create<ServiceStoreState>((set, get, store) => ({
  services: [],
  commonServices: [],
  notCommonServices: [],
  loadServicesList: async () => {
    const result = await axios.get(getServicesList());
    const services = result.data.response.map(
      (item: any) =>
        ({
          id: item.id,
          name: item.name,
          description: item.description,
          state: item.state,
          type: item.type,
          isCommon: item.iscommon,
          serviceId: item.serviceId,
          usedCount: 0,
        } as Service)
    );

    set({
      services,
      commonServices: services.filter((e: Service) => e.isCommon === true),
      notCommonServices: services.filter((e: Service) => e.isCommon === false),
    });
  },
  deleteService: async (id) => {
    const services = get().services.filter((e: Service) => e.serviceId !== id);
    set({
      services,
      commonServices: services.filter((e: Service) => e.isCommon === true),
      notCommonServices: services.filter((e: Service) => e.isCommon === false),
    });
  },
  selectedService: undefined,
  setSelectedService: (service: Service) => {
    set({
      selectedService: service,
    });
  },
  changeServiceState: async (onEnd, successMessage, errorMessage) => {
    const selectedService = get().selectedService;
    console.log(selectedService);
    if (!selectedService) return;

    try {
      await axios.post(changeServiceStatus(), {
        id: selectedService.serviceId,
        state:
          selectedService.state === ServiceState.Active
            ? ServiceState.Inactive
            : selectedService.state === ServiceState.Draft
            ? ServiceState.Ready
            : selectedService.state === ServiceState.Ready
            ? ServiceState.Draft
            : ServiceState.Active,
        type: selectedService.type,
      });
      useToastStore.getState().success({ title: successMessage });
      await useServiceListStore.getState().loadServicesList();
    } catch (_) {
      useToastStore.getState().error({ title: errorMessage });
    }
    set({
      selectedService: undefined,
    });
    onEnd();
  },
  checkServiceIntentConnection: async (onConnected, onNotConnected) => {
    const selectedService = get().selectedService;
    if (!selectedService) return;

    try {
      const res = await axios.post(changeIntentConnection(), {
        serviceId: selectedService.serviceId,
      });
      if (res.data.response) {
        onConnected();
      } else {
        onNotConnected();
      }
    } catch (_) {
      onNotConnected();
    }
  },
  deleteSelectedService: async (onEnd, successMessage, errorMessage) => {
    const selectedService = get().selectedService;
    if (!selectedService) return;

    try {
      await axios.post(deleteServiceApi(), {
        id: selectedService?.serviceId,
        type: selectedService?.type,
      });
      useToastStore.getState().success({ title: successMessage });
      await useServiceListStore.getState().deleteService(selectedService.serviceId);
    } catch (_) {
      useToastStore.getState().error({ title: errorMessage });
    }
    set({
      selectedService: undefined,
    });
    onEnd();
  },
}));

export default useServiceListStore;
