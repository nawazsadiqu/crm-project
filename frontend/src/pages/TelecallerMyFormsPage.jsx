import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiCreditCard,
    FiEye,
    FiChevronDown,
    FiChevronUp
} from "react-icons/fi";

import api from "../services/api";

import "../css/TelecallerMyFormsPage.css";

const TelecallerMyFormsPage = () => {
    const navigate = useNavigate();

    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [search, setSearch] = useState("");
    const [expandedId, setExpandedId] = useState(null);

    const fetchForms = async () => {
        try {
            setLoading(true);
            setMessage("");

            const { data } = await api.get(
                "/forms/closed-clients?view=all"
            );

            setForms(
                Array.isArray(data?.records)
                    ? data.records
                    : []
            );
        } catch (error) {
            setForms([]);

            setMessage(
                error.response?.data?.message ||
                "Failed to fetch forms"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchForms();
    }, []);

    const filteredForms = useMemo(() => {
        const value = search.trim().toLowerCase();

        if (!value) {
            return forms;
        }

        return forms.filter((item) => {
            return [
                item.businessName,
                item.fullName,
                item.mobileNumber,
                item.baName,
                item.city,
                item.area
            ]
                .filter(Boolean)
                .some((field) =>
                    String(field)
                        .toLowerCase()
                        .includes(value)
                );
        });
    }, [forms, search]);

    const getPackageAmount = (item) => {
        return Number(
            item.packageAmount ||
            item.revenue ||
            0
        );
    };

    const getTotalReceived = (item) => {
        return Number(
            item.totalReceivedAmount ||
            item.revenue ||
            0
        );
    };

    const getBalance = (item) => {
        const storedBalance =
            Number(item.balanceAmount);

        if (
            Number.isFinite(storedBalance) &&
            storedBalance >= 0
        ) {
            return storedBalance;
        }

        return Math.max(
            getPackageAmount(item) -
            getTotalReceived(item),
            0
        );
    };

    const formatMoney = (value) => {
        return Number(value || 0).toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );
    };

    const handleAddPayment = (item) => {
        navigate(
            `/telecaller/my-forms/${item._id}/payment`,
            {
                state: {
                    existingForm: item
                }
            }
        );
    };

    const toggleDetails = (id) => {
        setExpandedId((prev) =>
            prev === id ? null : id
        );
    };

    const getServices = (item) => {
        const services = [
            ...(Array.isArray(item.googleServices)
                ? item.googleServices
                : []),

            ...(item.googleServicesOther
                ? [item.googleServicesOther]
                : []),

            ...(Array.isArray(item.otherServices)
                ? item.otherServices
                : []),

            ...(item.otherServicesOther
                ? [item.otherServicesOther]
                : [])
        ];

        return services.length
            ? services.join(", ")
            : "-";
    };

    const renderPaymentHistory = (item) => {
        const history = [
            {
                date: item.date,
                amount:
                    item.amountReceivedNow ||
                    item.revenue,
                transactionId:
                    item.transactionIdOrChequeNumber,
                paymentDetails:
                    item.paymentDetails
            },

            ...(Array.isArray(item.paymentHistory)
                ? item.paymentHistory.map(
                    (payment) => ({
                        date: payment.paymentDate,
                        amount: payment.amount,
                        transactionId:
                            payment.transactionIdOrChequeNumber,
                        paymentDetails:
                            payment.paymentDetails
                    })
                )
                : [])
        ];

        return history.map((payment, index) => (
            <div
                className="tc-myforms-payment-item"
                key={`${payment.transactionId}-${index}`}
            >
                <div>
                    <strong>
                        Payment {index + 1}
                    </strong>

                    <span>
                        {payment.date || "-"}
                    </span>
                </div>

                <div>
                    ₹{formatMoney(payment.amount)}
                </div>

                <div>
                    {payment.paymentDetails || "-"}
                </div>

                <div>
                    {payment.transactionId || "-"}
                </div>
            </div>
        ));
    };

    return (
        <div className="tc-myforms-page">
            <div className="tc-myforms-header">
                <div>
                    <h2>My Forms / Payments</h2>

                    <p>
                        View your closed businesses and
                        manage pending payments.
                    </p>
                </div>

                <div className="tc-myforms-count">
                    {forms.length}
                    <span>Forms</span>
                </div>
            </div>

            <div className="tc-myforms-toolbar">
                <input
                    type="text"
                    value={search}
                    onChange={(e) =>
                        setSearch(e.target.value)
                    }
                    placeholder="Search business, customer, mobile or BA..."
                />
            </div>

            {message && (
                <div className="tc-myforms-message">
                    {message}
                </div>
            )}

            {loading ? (
                <div className="tc-myforms-empty">
                    Loading forms...
                </div>
            ) : filteredForms.length === 0 ? (
                <div className="tc-myforms-empty">
                    No forms found.
                </div>
            ) : (
                <div className="tc-myforms-list">
                    {filteredForms.map((item) => {
                        const packageAmount =
                            getPackageAmount(item);

                        const totalReceived =
                            getTotalReceived(item);

                        const balance =
                            getBalance(item);

                        const isPaid =
                            balance <= 0;

                        const isExpanded =
                            expandedId === item._id;

                        return (
                            <div
                                className="tc-myforms-card"
                                key={item._id}
                            >
                                <div className="tc-myforms-card-main">
                                    <div className="tc-myforms-business">
                                        <h3>
                                            {item.businessName ||
                                                "Unnamed Business"}
                                        </h3>

                                        <p>
                                            {item.fullName || "-"}
                                        </p>

                                        <span>
                                            {item.mobileNumber || "-"}
                                        </span>
                                    </div>

                                    <div className="tc-myforms-financials">
                                        <div>
                                            <span>
                                                Package
                                            </span>

                                            <strong>
                                                ₹{formatMoney(
                                                    packageAmount
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Received
                                            </span>

                                            <strong>
                                                ₹{formatMoney(
                                                    totalReceived
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Balance
                                            </span>

                                            <strong>
                                                ₹{formatMoney(
                                                    balance
                                                )}
                                            </strong>
                                        </div>
                                    </div>

                                    <div className="tc-myforms-status-area">
                                        <span
                                            className={
                                                isPaid
                                                    ? "tc-payment-status paid"
                                                    : "tc-payment-status pending"
                                            }
                                        >
                                            {isPaid
                                                ? "Paid"
                                                : "Partially Paid"}
                                        </span>

                                        <small>
                                            Closed By BA:
                                            {" "}
                                            {item.baName || "-"}
                                        </small>
                                    </div>

                                    <div className="tc-myforms-actions">
                                        {!isPaid && (
                                            <button
                                                type="button"
                                                className="tc-payment-btn"
                                                onClick={() =>
                                                    handleAddPayment(
                                                        item
                                                    )
                                                }
                                            >
                                                <FiCreditCard />

                                                Add Payment
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            className="tc-view-btn"
                                            onClick={() =>
                                                toggleDetails(
                                                    item._id
                                                )
                                            }
                                        >
                                            <FiEye />

                                            Details

                                            {isExpanded ? (
                                                <FiChevronUp />
                                            ) : (
                                                <FiChevronDown />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="tc-myforms-details">
                                        <div className="tc-myforms-details-grid">
                                            <div>
                                                <span>
                                                    Form Date
                                                </span>

                                                <strong>
                                                    {item.date || "-"}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Closing BA
                                                </span>

                                                <strong>
                                                    {item.baName || "-"}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    BA Employee ID
                                                </span>

                                                <strong>
                                                    {item.baId || "-"}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Payment Status
                                                </span>

                                                <strong>
                                                    {item.paymentStatus ||
                                                        (isPaid
                                                            ? "Paid"
                                                            : "Partially Paid")}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    City
                                                </span>

                                                <strong>
                                                    {item.city || "-"}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Area
                                                </span>

                                                <strong>
                                                    {item.area || "-"}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Service Category
                                                </span>

                                                <strong>
                                                    {item.serviceCategory ===
                                                        "googleServices"
                                                        ? "Google Services"
                                                        : item.serviceCategory ===
                                                            "otherServices"
                                                            ? "Other Services"
                                                            : "-"}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Services
                                                </span>

                                                <strong>
                                                    {getServices(item)}
                                                </strong>
                                            </div>
                                        </div>

                                        <div className="tc-myforms-payment-history">
                                            <h4>
                                                Payment History
                                            </h4>

                                            {renderPaymentHistory(
                                                item
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default TelecallerMyFormsPage;