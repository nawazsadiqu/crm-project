import { useEffect, useState } from "react";
import api from "../services/api";
import "../css/forms.css";
import "../css/adminApprovals.css";

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
          "Failed to fetch form approval requests"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const approveRequest = async (id, closeBalance = false) => {
  const adminComment = window.prompt(
    closeBalance
      ? "Enter reason for completing this payment with remaining balance approval:"
      : "Enter approval comment, or leave blank:"
  );

  try {
    const { data } = await api.patch(`/form-approvals/${id}/approve`, {
      adminComment: adminComment || "",
      closeBalance
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

  const getRequestTypeLabel = (requestType) => {
    if (requestType === "UNDERPAYMENT_ADDITIONAL_PAYMENT") {
      return "Additional Payment Balance Approval";
    }

    return "Duplicate Transaction Approval";
  };

  return (
    <div className="forms-page">
      <div className="forms-page-card">
        <div className="forms-header">
          <div>
            <h2 className="forms-title">Form Approval Requests</h2>
            <p className="forms-subtitle">
              Review duplicate transaction and additional payment balance requests
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
          <p className="forms-empty">No pending form approval requests.</p>
        ) : (
          <div className="forms-table-wrapper">
            <table className="forms-table">
              <thead>
                <tr>
                  <th>Requested Date</th>
                  <th>Request Type</th>
                  <th>Reason</th>
                  <th>Transaction / Cheque</th>
                  <th>BA Name</th>
                  <th>BA ID</th>
                  <th>Business</th>
                  <th>New Amount</th>
                  <th>Package Amount</th>
                  <th>Balance</th>
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

                    <td>{getRequestTypeLabel(item.requestType)}</td>
                    <td>{item.approvalReason || "-"}</td>
                    <td>{item.transactionIdOrChequeNumber || "-"}</td>
                    <td>{item.requestedByName || item.formData?.baName || "-"}</td>
                    <td>
                      {item.requestedByEmployeeId || item.formData?.baId || "-"}
                    </td>
                    <td>{item.formData?.businessName || item.existingFormSnapshot?.businessName || "-"}</td>
                    <td>
                      ₹{Number(item.formData?.revenue || 0).toLocaleString("en-IN")}
                    </td>
                    <td>
                      ₹{Number(item.formData?.packageAmount || 0).toLocaleString("en-IN")}
                    </td>
                    <td>
                      ₹{Number(item.formData?.balanceAmount || 0).toLocaleString("en-IN")}
                    </td>

                    <td>{item.existingFormSnapshot?.businessName || "-"}</td>
                    <td>{item.existingFormSnapshot?.baName || "-"}</td>
                    <td>
                      ₹
                      {Number(
                        item.existingFormSnapshot?.revenue || 0
                      ).toLocaleString("en-IN")}
                    </td>

                    <td className="approval-action-cell">
  {item.requestType === "UNDERPAYMENT_ADDITIONAL_PAYMENT" ? (
    <div className="approval-action-group">
      <button
        className="approval-btn approval-btn-success"
        onClick={() => approveRequest(item._id, false)}
      >
        Approve Payment Only
      </button>

      <button
        className="approval-btn approval-btn-complete"
        onClick={() => approveRequest(item._id, true)}
      >
        Approve & Complete
      </button>

      <button
        className="approval-btn approval-btn-reject"
        onClick={() => rejectRequest(item._id)}
      >
        Reject
      </button>
    </div>
  ) : (
    <div className="approval-action-group">
      <button
        className="approval-btn approval-btn-success"
        onClick={() => approveRequest(item._id, false)}
      >
        Approve
      </button>

      <button
        className="approval-btn approval-btn-reject"
        onClick={() => rejectRequest(item._id)}
      >
        Reject
      </button>
    </div>
  )}
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