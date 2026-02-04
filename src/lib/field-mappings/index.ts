// Field Mappings - Cross-tool data transformation utilities

export {
  EVOBIO_TO_XENOMYTH_MAPPINGS,
  mapEvoBioToXenomyth,
  applyMappedFields,
  type FieldMapping,
  type MappedField,
} from "./evobio-to-xenomyth";

export {
  mapEvoBioToSpeciesMatrix,
  mapSpeciesMatrixToEvoBio,
  EVOBIO_TO_MATRIX_PREVIEW_FIELDS,
  type SpeciesMatrixSpecies,
  type EvoBioToMatrixMapping,
} from "./evobio-to-species-matrix";
