import GenerationShipSummaryTemplate from "./GenerationShipSummaryTemplate";

interface Props {
  formState: Record<string, unknown>;
  worldName?: string;
  date?: string;
}

const GenerationShipFullReportTemplate = (props: Props) => <GenerationShipSummaryTemplate {...props} full />;

export default GenerationShipFullReportTemplate;
