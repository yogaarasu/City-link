import { Navigate, useParams } from "react-router-dom";

const CitySnapshot = () => {
  const { district = "" } = useParams();
  return <Navigate to={`/super-admin/cities/${encodeURIComponent(district)}`} replace />;
};

export default CitySnapshot;
