import { getListPage } from "@/lib/contentParser";
import ListPage from "@/partials/ListPage";

const WorkWithUs = () => (
  <ListPage data={getListPage("work-with-us/_index.md")} />
);

export default WorkWithUs;
