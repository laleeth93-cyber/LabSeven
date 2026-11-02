import CentralLibraryManager from "./CentralLibraryManager";
import { getCentralLibraryData } from "@/app/actions/master-sync";

export default async function CentralLibraryPage() {
  const data = await getCentralLibraryData();
  return <CentralLibraryManager initialData={data} />;
}
