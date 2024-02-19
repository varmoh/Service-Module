import { create } from 'zustand';
import { GroupOrRule } from 'components/FlowElementsPopup/RuleBuilder/types';

interface FlowState {
  rules: GroupOrRule[];
  isYesNoQuestion: boolean;
  setIsYesNoQuestion: (value: boolean) => void;
  changeRulesNode: (rules: GroupOrRule[]) => void;
  reset: () => void;
}

const useFlowStore = create<FlowState>((set, get, store) => ({
  rules: [],
  isYesNoQuestion: false,
  setIsYesNoQuestion: (value: boolean) => {
    set({ isYesNoQuestion: value });
  },
  changeRulesNode: (rules) => {
    set({ rules });
  },
  reset: () => {
    set({
      rules: [],
      isYesNoQuestion: false,
    });
  },
}));

export default useFlowStore;

export const conditionOptions = [ 
  '==', '===', '!=', '!==', '>', '<', '>=', '<='
].map(x=>({ label: x, value: x }))
