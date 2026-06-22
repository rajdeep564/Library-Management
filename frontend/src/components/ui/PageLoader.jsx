import Spinner from "./Spinner";
import "./ui.css";

export default function PageLoader({ label = "Loading, please wait..." }) {
  return (
    <div className="ui-page-loader animate-fadeIn">
      <Spinner size="lg" label={label} />
    </div>
  );
}
