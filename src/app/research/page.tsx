import { getListPage } from "@/lib/contentParser";
import ListPage from "@/partials/ListPage";

const Research = () => <ListPage data={getListPage("research/_index.md")} />;

export default Research;
