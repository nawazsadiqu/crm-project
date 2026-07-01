import { useEffect, useState } from "react";
import api from "../services/api";

const AdminDuplicateTransactionApprovals = () => {
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/form-approvals/pending");
      setRequests(Array.isArray(data) ? data : []);
      setMessage("");
    } catch (error) {
      setRequests([]);
      setMessage(
        error.response?.data?.message ||
          "Failed to fetch duplicate transaction approval requests"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const approveRequest = async (id) => {
    const adminComment = window.prompt(
      "Enter approval comment, or leave blank:"
    );

    try {
      const { data } = await api.patch(`/form-approvals/${id}/approve`, {
        adminComment: adminComment || ""
      });

      setMessage(data.message || "Approved successfully");
      fetchPendingRequests();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to approve request");
    }
  };

  const rejectRequest = async (id) => {
    const adminComment = window.prompt(
      "Enter rejection reason, or leave blank:"
    );

    try {
      const { data } = await api.patch(`/form-approvals/${id}/reject`, {
        adminComment: adminComment || ""
      });

      setMessage(data.message || "Rejected successfully");
      fetchPendingRequests();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to reject request");
    }
  };

  return (
    <div className="forms-page">
      <div className="forms-page-card">
        <div className="forms-header">
          <div>
            <h2 className="forms-title">Duplicate Transaction Approvals</h2>
            <p className="forms-subtitle">
              Review repeated Transaction ID / Cheque Number requests from BA forms
            </p>
          </div>

          <button className="btn btn-primary" onClick={fetchPendingRequests}>
            Refresh
          </button>
        </div>

        {message && <p className="forms-message">{message}</p>}

        {loading ? (
          <p className="forms-loading">Loading approval requests...</p>
        ) : requests.length === 0 ? (
          <p className="forms-empty">No pending duplicate transaction requests.</p>
        ) : (
          <div className="forms-table-wrapper">
            <table className="forms-table">
              <thead>
                <tr>
                  <th>Requested Date</th>
                  <th>Transaction / Cheque</th>
                  <th>BA Name</th>
                  <th>BA ID</th>
                  <th>New Business</th>
                  <th>New Revenue</th>
                  <th>Existing Business</th>
                  <th>Existing BA</th>
                  <th>Existing Revenue</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {requests.map((item) => (
                  <tr key={item._id}>
                    <td>
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString("en-IN")
                        : "-"}
                    </td>

                    <td>{item.transactionIdOrChequeNumber || "-"}</td>
                    <td>{item.requestedByName || item.formData?.baName || "-"}</td>
                    <td>
                      {item.requestedByEmployeeId || item.formData?.baId || "-"}
                    </td>
                    <td>{item.formData?.businessName || "-"}</td>
                    <td>
                      ₹{Number(item.formData?.revenue || 0).toLocaleString("en-IN")}
                    </td>

                    <td>{item.existingFormSnapshot?.businessName || "-"}</td>
                    <td>{item.existingFormSnapshot?.baName || "-"}</td>
                    <td>
                      ₹
                      {Number(
                        item.existingFormSnapshot?.revenue || 0
                      ).toLocaleString("en-IN")}
                    </td>

                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => approveRequest(item._id)}
                      >
                        Approve
                      </button>

                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ marginLeft: "8px" }}
                        onClick={() => rejectRequest(item._id)}
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDuplicateTransactionApprovals;