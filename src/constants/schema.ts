import { workflows } from '../hailer/workspace-bindings';

const wf = workflows.inventoryDatabase_017;

export const INVENTORY = {
  workflowId: wf.id,
  phaseId: wf.phases.newPhase_016.id,
  fields: {
    sku: '6a0c242d19566c76c84922f8',
    photo: wf.fields.photo.id,
    binLocation: wf.fields.binLocation.id,
    quantityOnHand: '6a0c251a19566c76c8492813',
    minimumStock: '6a0c26f719566c76c84932b8',
    productDescription: '6a0c295d19566c76c8494367',
    supplier: '6a0c272819566c76c84933f5',
  },
} as const;
