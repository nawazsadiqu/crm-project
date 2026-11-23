import {
  Fragment,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  useLocation
} from "react-router-dom";

import {
  FaEye,
  FaEyeSlash
} from "react-icons/fa";

import api from "../services/api";

import "../css/forms.css";


const GOOGLE_SERVICE_OPTIONS = [
  "GMB Profile",
  "Photoshoot",
  "Optimization",
  "Page Handling",
  "Contact Number",
  "Suspended Page",
  "Others"
];


const OTHER_SERVICE_OPTIONS = [
  "Google Ads",
  "Website",
  "Social Media Marketing",
  "Meta Ads",
  "Other Services"
];


const createEmptyFormData = () => ({
  sourcePresentationId: "",
  email: "",
  accessEmail: "",
  accessPassword: "",
  hasAccessPassword: false,

  revenue: "",
  paymentType: "complete",
  packageAmount: "",
  parentFormId: "",
  previousReceivedAmount: 0,

  pincode: "",
  city: "",
  area: "",

  baName: "",
  baId: "",
  closedByBaId: "",

  businessName: "",
  mobileNumber: "",
  fullName: "",
  address: "",

  gstNumber: "",
  gstInvoiceName: "",

  typeOfBusiness: "",
  typeOfBusinessOther: "",

  googleMapLink: "",

  transactionIdOrChequeNumber: "",
  paymentDetails: "",
  paymentDetailsOther: "",

  serviceCategory: "",

  googleServices: [],
  googleServicesOther: "",

  otherServices: [],
  otherServicesOther: ""
});


const TelecallerFormPage = () => {

  const location =
    useLocation();

  /*
    -----------------------------------------
    ROUTE STATE
    -----------------------------------------
  */

  const sourceAppointment =
    location.state?.sourceAppointment ||
    null;

  const existingForm =
    location.state?.existingForm ||
    null;


  /*
    -----------------------------------------
    DATE
    -----------------------------------------
  */

  const today =
    new Date()
      .toISOString()
      .split("T")[0];

  const currentMonth =
    today.slice(0, 7);


  /*
    -----------------------------------------
    MAIN STATE
    -----------------------------------------
  */

  const [
    selectedDate,
    setSelectedDate
  ] =
    useState(today);


  const [
    selectedMonth,
    setSelectedMonth
  ] =
    useState(currentMonth);


  const [
    formData,
    setFormData
  ] =
    useState(
      createEmptyFormData()
    );


  const [
    formsData,
    setFormsData
  ] =
    useState([]);


  const [
    pendingRecords,
    setPendingRecords
  ] =
    useState([]);

  const [activeBas, setActiveBas] = useState([]);

  const [activeBasError, setActiveBasError] = useState("");


  const [
    loading,
    setLoading
  ] =
    useState(false);


  const [
    pendingLoading,
    setPendingLoading
  ] =
    useState(false);


  const [
    message,
    setMessage
  ] =
    useState("");


  const [
    pendingMessage,
    setPendingMessage
  ] =
    useState("");


  const [
    errors,
    setErrors
  ] =
    useState({});


  const [
    editingId,
    setEditingId
  ] =
    useState(null);


  const [
    expandedFormId,
    setExpandedFormId
  ] =
    useState(null);


  const [
    showAccessPassword,
    setShowAccessPassword
  ] =
    useState(false);





  const [
    showForm,
    setShowForm
  ] =
    useState(
      Boolean(
        sourceAppointment ||
        existingForm
      )
    );


  /*
    -----------------------------------------
    SUCCESS POPUP
    -----------------------------------------
  */

  const [
    successPopupMode,
    setSuccessPopupMode
  ] =
    useState("success");


  const [
    approvalPendingMessage,
    setApprovalPendingMessage
  ] =
    useState("");


  const [
    showSuccessPopup,
    setShowSuccessPopup
  ] =
    useState(false);


  /*
    -----------------------------------------
    MODES
    -----------------------------------------
  */

  const isAdditionalPaymentMode =
    formData.paymentType ===
    "additional";


  /*
    -----------------------------------------
    EX GST
    -----------------------------------------
  */

  const exGst =
    useMemo(() => {

      const revenueNumber =
        Number(
          formData.revenue
        );


      if (
        !formData.revenue ||
        Number.isNaN(
          revenueNumber
        ) ||
        revenueNumber < 0
      ) {

        return "";

      }


      return (
        revenueNumber /
        1.18
      ).toFixed(2);

    }, [
      formData.revenue
    ]);


  /*
    -----------------------------------------
    GOOGLE ACCESS REQUIREMENT
    -----------------------------------------
  */

  const requiresGoogleAccess =
    useMemo(() => {

      if (
        formData.serviceCategory !==
        "googleServices"
      ) {

        return false;

      }


      const accessRequiredServices = [
        "GMB Profile",
        "Suspended Page",
        "Contact Number"
      ];


      return (
        accessRequiredServices.some(
          (service) =>
            formData.googleServices.includes(
              service
            )
        )
      );

    }, [
      formData.serviceCategory,
      formData.googleServices
    ]);


  /*
    -----------------------------------------
    BALANCE
    -----------------------------------------
  */

  const calculatedBalance =
    useMemo(() => {

      const receivedAmount =
        Number(
          formData.revenue ||
          0
        );


      const packageAmount =
        formData.paymentType ===
          "complete"

          ? receivedAmount

          : Number(
            formData.packageAmount ||
            0
          );


      const previousReceivedAmount =
        formData.paymentType ===
          "additional"

          ? Number(
            formData.previousReceivedAmount ||
            0
          )

          : 0;


      if (
        !packageAmount ||
        Number.isNaN(
          packageAmount
        )
      ) {

        return "";

      }


      const balance =
        packageAmount -
        previousReceivedAmount -
        receivedAmount;


      return balance > 0
        ? balance.toFixed(2)
        : "0.00";

    }, [
      formData.paymentType,
      formData.packageAmount,
      formData.revenue,
      formData.previousReceivedAmount
    ]);


  const currentPaymentStatus =
    useMemo(() => {

      if (
        !formData.revenue &&
        !formData.packageAmount
      ) {

        return "-";

      }


      const balance =
        Number(
          calculatedBalance ||
          0
        );


      return balance > 0
        ? "Partially Paid"
        : "Paid";

    }, [
      calculatedBalance,
      formData.revenue,
      formData.packageAmount
    ]);


  /*
    =========================================
    FETCH PENDING FORMS
    =========================================
  */

  const fetchPendingRecords =
    async () => {

      try {

        setPendingLoading(
          true
        );

        setPendingMessage(
          ""
        );


        const { data } =
          await api.get(
            "/presentation-details/telecaller-appointments/form-pending"
          );


        setPendingRecords(
          Array.isArray(
            data
          )
            ? data
            : []
        );


      } catch (error) {

        setPendingRecords(
          []
        );


        setPendingMessage(
          error.response
            ?.data
            ?.message ||
          "Failed to fetch pending forms"
        );


      } finally {

        setPendingLoading(
          false
        );

      }

    };


  /*
    =========================================
    FETCH FILLED FORMS
    =========================================
  */

  const fetchFormsByMonth =
    async () => {

      try {

        setLoading(true);


        const { data } =
          await api.get(
            `/forms?month=${selectedMonth}`
          );


        setFormsData(
          Array.isArray(
            data
          )
            ? data
            : []
        );


      } catch (error) {

        setFormsData(
          []
        );


        setMessage(
          error.response
            ?.data
            ?.message ||
          "Failed to fetch forms data"
        );


      } finally {

        setLoading(false);

      }

    };


  /*
    =========================================
    RESET FORM
    =========================================
  */

  const resetForm =
    () => {

      setFormData(
        createEmptyFormData()
      );

      setEditingId(
        null
      );

      setSelectedDate(
        today
      );

      setErrors(
        {}
      );

      setShowAccessPassword(
        false
      );

    };


  /*
    =========================================
    LOAD PENDING DEAL INTO FORM
    =========================================
  */

  const loadPendingAppointment =
    (
      item
    ) => {

      setShowForm(true);

      setErrors(
        {}
      );

      setMessage(
        ""
      );

      setEditingId(
        null
      );


      setSelectedDate(
        item.visitedDate ||
        item.appointmentDate ||
        today
      );


      setFormData({
        ...createEmptyFormData(),

        sourcePresentationId:
          item._id ||
          "",

        businessName:
          item.businessName ||
          "",

        mobileNumber:
          item.contact ||
          "",

        googleMapLink:
          item.mapLink ||
          "",

        baName:
          item
            .dealClosedByBaId
            ?.name ||

          item
            .assignedBaId
            ?.name ||

          "",

        baId: ""
      });


      setTimeout(() => {

        document
          .getElementById(
            "telecaller-form-entry"
          )
          ?.scrollIntoView({
            behavior:
              "smooth",

            block:
              "start"
          });

      }, 100);

    };


  /*
    =========================================
    LOAD FORM FOR EDIT
    =========================================
  */

  const handleEdit =
    (
      item
    ) => {

      setShowForm(true);

      setErrors(
        {}
      );

      setMessage(
        ""
      );


      setEditingId(
        item._id
      );


      setSelectedDate(
        item.date ||
        today
      );


      setFormData({

        sourcePresentationId:
          item.sourcePresentationId ||
          "",

        email:
          item.email ||
          "",

        accessEmail:
          item.accessEmail ||
          "",

        accessPassword:
          "",

        hasAccessPassword:
          Boolean(
            item.hasAccessPassword
          ),

        revenue:
          item.totalReceivedAmount ??
          item.revenue ??
          "",

        paymentType:
          item.paymentType ||
          "complete",

        packageAmount:
          item.packageAmount ??
          item.revenue ??
          "",

        parentFormId:
          item.parentFormId ||
          "",

        previousReceivedAmount:
          item.paymentType ===
            "additional"

            ? Number(
              item.totalReceivedAmount ||
              item.revenue ||
              0
            )

            : 0,

        pincode:
          item.pincode ||
          "",

        city:
          item.city ||
          "",

        area:
          item.area ||
          "",

        baName:
          item.baName ||
          "",

        baId:
          item.baId ||
          "",
        closedByBaId:
          item.closedByBaId?._id ||
          item.closedByBaId ||
          "",

        businessName:
          item.businessName ||
          "",

        mobileNumber:
          item.mobileNumber ||
          "",

        fullName:
          item.fullName ||
          "",

        address:
          item.address ||
          "",

        gstNumber:
          item.gstNumber ||
          "",

        gstInvoiceName:
          item.gstInvoiceName ||
          "",

        typeOfBusiness:
          item.typeOfBusiness ||
          "",

        typeOfBusinessOther:
          item.typeOfBusinessOther ||
          "",

        googleMapLink:
          item.googleMapLink ||
          "",

        transactionIdOrChequeNumber:
          item.transactionIdOrChequeNumber ||
          "",

        paymentDetails:
          item.paymentDetails ||
          "",

        paymentDetailsOther:
          item.paymentDetailsOther ||
          "",

        serviceCategory:
          item.serviceCategory ||
          "",

        googleServices:
          item.googleServices ||
          [],

        googleServicesOther:
          item.googleServicesOther ||
          "",

        otherServices:
          item.otherServices ||
          [],

        otherServicesOther:
          item.otherServicesOther ||
          ""
      });


      setTimeout(() => {

        document
          .getElementById(
            "telecaller-form-entry"
          )
          ?.scrollIntoView({
            behavior:
              "smooth",

            block:
              "start"
          });

      }, 100);

    };


  /*
    =========================================
    ADD PAYMENT
    =========================================
  */

  const handleAddPayment =
    (
      item
    ) => {

      setShowForm(true);

      setErrors(
        {}
      );

      setMessage(
        ""
      );


      setEditingId(
        item._id
      );


      setSelectedDate(
        today
      );


      setFormData({

        sourcePresentationId:
          item.sourcePresentationId ||
          "",

        email:
          item.email ||
          "",

        accessEmail:
          item.accessEmail ||
          "",

        accessPassword:
          "",

        hasAccessPassword:
          Boolean(
            item.hasAccessPassword
          ),

        revenue:
          "",

        paymentType:
          "additional",

        packageAmount:
          item.packageAmount ||
          item.revenue ||
          "",

        parentFormId:
          item._id,

        previousReceivedAmount:
          Number(
            item.totalReceivedAmount ||
            item.amountReceivedNow ||
            item.revenue ||
            0
          ),

        pincode:
          item.pincode ||
          "",

        city:
          item.city ||
          "",

        area:
          item.area ||
          "",

        baName:
          item.baName ||
          "",

        baId:
          item.baId ||
          "",

        closedByBaId:
          item.closedByBaId?._id ||
          item.closedByBaId ||
          "",

        businessName:
          item.businessName ||
          "",

        mobileNumber:
          item.mobileNumber ||
          "",

        fullName:
          item.fullName ||
          "",

        address:
          item.address ||
          "",

        gstNumber:
          item.gstNumber ||
          "",

        gstInvoiceName:
          item.gstInvoiceName ||
          "",

        typeOfBusiness:
          item.typeOfBusiness ||
          "",

        typeOfBusinessOther:
          item.typeOfBusinessOther ||
          "",

        googleMapLink:
          item.googleMapLink ||
          "",

        transactionIdOrChequeNumber:
          "",

        paymentDetails:
          "",

        paymentDetailsOther:
          "",

        serviceCategory:
          item.serviceCategory ||
          "",

        googleServices:
          item.googleServices ||
          [],

        googleServicesOther:
          item.googleServicesOther ||
          "",

        otherServices:
          item.otherServices ||
          [],

        otherServicesOther:
          item.otherServicesOther ||
          ""
      });


      setTimeout(() => {

        document
          .getElementById(
            "telecaller-form-entry"
          )
          ?.scrollIntoView({
            behavior:
              "smooth",

            block:
              "start"
          });

      }, 100);

    };


  /*
    =========================================
    INITIAL LOAD
    =========================================
  */


  useEffect(() => {
    let mounted = true;

    const fetchActiveBas = async () => {
      try {
        const { data } = await api.get("/forms/active-bas");

        if (mounted) {
          setActiveBas(Array.isArray(data) ? data : []);
          setActiveBasError("");
        }
      } catch (error) {
        if (mounted) {
          setActiveBas([]);

          setActiveBasError(
            error.response?.data?.message ||
            "Unable to load active BA employees. Try reloading the page."
          );
        }
      }
    };

    fetchActiveBas();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {

    fetchPendingRecords();

  }, []);


  useEffect(() => {

    fetchFormsByMonth();

  }, [
    selectedMonth
  ]);


  /*
    DIRECT SOURCE APPOINTMENT SUPPORT
  */

  useEffect(() => {

    if (
      !sourceAppointment
    ) {

      return;

    }


    loadPendingAppointment(
      sourceAppointment
    );

  }, [
    sourceAppointment
  ]);


  /*
    OLD ADD PAYMENT ROUTE SUPPORT
  */

  useEffect(() => {

    if (
      !existingForm
    ) {

      return;

    }


    handleAddPayment(
      existingForm
    );

  }, [
    existingForm
  ]);


  /*
    =========================================
    INPUT CHANGE
    =========================================
  */

  const preventNumberScroll =
    (
      event
    ) => {

      event
        .currentTarget
        .blur();

    };


  const handleChange =
    (
      event
    ) => {

      const {
        name,
        value
      } =
        event.target;


      setFormData(
        (
          previous
        ) => {

          const updated = {
            ...previous,
            [name]:
              value
          };


          if (
            name ===
            "paymentType"
          ) {

            if (
              value ===
              "complete"
            ) {

              updated.packageAmount =
                updated.revenue ||
                "";

              updated.parentFormId =
                "";

              updated.previousReceivedAmount =
                0;

            }


            if (
              value ===
              "partial"
            ) {

              updated.parentFormId =
                "";

              updated.previousReceivedAmount =
                0;


              if (
                !updated.packageAmount
              ) {

                updated.packageAmount =
                  updated.revenue ||
                  "";

              }

            }

          }


          if (
            name ===
            "revenue" &&
            updated.paymentType ===
            "complete"
          ) {

            updated.packageAmount =
              value;

          }


          if (
            name ===
            "typeOfBusiness" &&
            value !==
            "Other"
          ) {

            updated.typeOfBusinessOther =
              "";

          }


          if (
            name ===
            "paymentDetails" &&
            value !==
            "Other"
          ) {

            updated.paymentDetailsOther =
              "";

          }


          if (
            name ===
            "serviceCategory"
          ) {

            if (
              value ===
              "googleServices"
            ) {

              updated.otherServices =
                [];

              updated.otherServicesOther =
                "";

            }


            if (
              value ===
              "otherServices"
            ) {

              updated.googleServices =
                [];

              updated.googleServicesOther =
                "";

            }

          }


          return updated;

        }
      );

    };


  /*
    =========================================
    SERVICE CHECKBOX
    =========================================
  */

  const handleServiceCheckboxChange =
    (
      fieldName,
      value
    ) => {

      setFormData(
        (
          previous
        ) => {

          const currentValues =
            Array.isArray(
              previous[
              fieldName
              ]
            )

              ? previous[
              fieldName
              ]

              : [];


          const exists =
            currentValues.includes(
              value
            );


          const updatedValues =
            exists

              ? currentValues.filter(
                (
                  item
                ) =>
                  item !==
                  value
              )

              : [
                ...currentValues,
                value
              ];


          const updated = {
            ...previous,

            [fieldName]:
              updatedValues
          };


          if (
            fieldName ===
            "googleServices" &&
            !updatedValues.includes(
              "Others"
            )
          ) {

            updated.googleServicesOther =
              "";

          }


          if (
            fieldName ===
            "otherServices" &&
            !updatedValues.includes(
              "Other Services"
            )
          ) {

            updated.otherServicesOther =
              "";

          }


          return updated;

        }
      );

    };


  /*
    =========================================
    VALIDATION
    =========================================
  */

  const validateForm =
    () => {

      const newErrors =
        {};


      const requiredFields = {

        email:
          "Email is required",

        revenue:
          "Revenue is required",

        paymentType:
          "Payment type is required",

        pincode:
          "Pincode is required",

        city:
          "City is required",

        area:
          "Area is required",

        businessName:
          "Business name is required",

        mobileNumber:
          "Mobile number is required",

        fullName:
          "Full name is required",

        address:
          "Address is required",

        gstNumber:
          "GST number is required",

        gstInvoiceName:
          "GST invoice name is required",

        typeOfBusiness:
          "Type of business is required",

        googleMapLink:
          "Google map link is required",

        transactionIdOrChequeNumber:
          "Transaction ID / Cheque number is required",

        paymentDetails:
          "Payment details is required",

        serviceCategory:
          "Service category is required"

      };


      Object
        .entries(
          requiredFields
        )
        .forEach(
          (
            [
              field,
              errorMessage
            ]
          ) => {

            if (
              !formData[
                field
              ]
                ?.toString()
                .trim()
            ) {

              newErrors[
                field
              ] =
                errorMessage;

            }

          }
        );


      if (
        !selectedDate
      ) {

        newErrors.selectedDate =
          "Date is required";

      }


      if (
        (
          formData.paymentType ===
          "partial" ||

          formData.paymentType ===
          "additional"
        ) &&

        !formData.packageAmount
          ?.toString()
          .trim()
      ) {

        newErrors.packageAmount =
          "Package amount is required";

      }


      if (
        formData.paymentType ===
        "partial" ||

        formData.paymentType ===
        "additional"
      ) {

        const packageAmountNumber =
          Number(
            formData.packageAmount ||
            0
          );


        const receivedAmountNumber =
          Number(
            formData.revenue ||
            0
          );


        if (
          packageAmountNumber <=
          0
        ) {

          newErrors.packageAmount =
            "Package amount must be greater than 0";

        }


        if (
          receivedAmountNumber <=
          0
        ) {

          newErrors.revenue =
            "Payment received amount must be greater than 0";

        }


        const previousReceivedAmountNumber =
          formData.paymentType ===
            "additional"

            ? Number(
              formData.previousReceivedAmount ||
              0
            )

            : 0;


        const remainingAmount =
          packageAmountNumber -
          previousReceivedAmountNumber;


        if (
          receivedAmountNumber >
          remainingAmount
        ) {

          newErrors.revenue =
            "Payment received cannot be greater than balance amount";

        }

      }


      if (
        formData.typeOfBusiness ===
        "Other" &&

        !formData
          .typeOfBusinessOther
          .trim()
      ) {

        newErrors.typeOfBusinessOther =
          "Other business type is required";

      }


      if (
        formData.paymentDetails ===
        "Other" &&

        !formData
          .paymentDetailsOther
          .trim()
      ) {

        newErrors.paymentDetailsOther =
          "Other payment details is required";

      }


      if (
        formData.serviceCategory ===
        "googleServices" &&

        formData
          .googleServices
          .length ===
        0
      ) {

        newErrors.googleServices =
          "Please select at least one Google service";

      }


      if (
        formData.googleServices.includes(
          "Others"
        ) &&

        !formData
          .googleServicesOther
          .trim()
      ) {

        newErrors.googleServicesOther =
          "Other Google service is required";

      }


      if (
        formData.serviceCategory ===
        "otherServices" &&

        formData
          .otherServices
          .length ===
        0
      ) {

        newErrors.otherServices =
          "Please select at least one Other service";

      }


      if (
        formData.otherServices.includes(
          "Other Services"
        ) &&

        !formData
          .otherServicesOther
          .trim()
      ) {

        newErrors.otherServicesOther =
          "Other service details is required";

      }


      if (
        requiresGoogleAccess
      ) {

        if (
          !formData
            .accessEmail
            .trim()
        ) {

          newErrors.accessEmail =
            "Access email ID is required";

        }


        if (
          !formData.accessPassword &&
          !formData.hasAccessPassword
        ) {

          newErrors.accessPassword =
            "Access password is required";

        }

      }


      setErrors(
        newErrors
      );


      if (
        Object.keys(
          newErrors
        ).length >
        0
      ) {

        setMessage(
          "Please fill all mandatory fields. Form is not saved."
        );


        document
          .getElementById(
            "telecaller-form-entry"
          )
          ?.scrollIntoView({
            behavior:
              "smooth"
          });


        return false;

      }


      setMessage(
        ""
      );


      return true;

    };


  /*
    =========================================
    SAVE
    =========================================
  */

  const handleSave =
    async () => {

      try {

        if (
          !validateForm()
        ) {

          return;

        }


        setMessage(
          ""
        );

        setApprovalPendingMessage(
          ""
        );

        setSuccessPopupMode(
          "saving"
        );

        setShowSuccessPopup(
          true
        );


        const payload = {

          sourcePresentationId:
            formData.sourcePresentationId ||
            "",

          date:
            selectedDate,

          email:
            formData.email.trim(),

          accessEmail:
            requiresGoogleAccess

              ? formData.accessEmail.trim()

              : "",

          accessPassword:
            requiresGoogleAccess

              ? formData.accessPassword

              : "",

          revenue:
            Number(
              formData.revenue
            ),

          paymentType:
            formData.paymentType,

          packageAmount:
            formData.paymentType ===
              "complete"

              ? Number(
                formData.revenue
              )

              : Number(
                formData.packageAmount
              ),

          parentFormId:
            formData.parentFormId ||
            "",

          pincode:
            formData.pincode.trim(),

          city:
            formData.city.trim(),

          area:
            formData.area.trim(),

          baName:
            formData.baName,

          baId:
            formData.baId,
          closedByBaId:
            !formData.sourcePresentationId &&
              !editingId &&
              !isAdditionalPaymentMode
              ? formData.closedByBaId || null
              : null,

          businessName:
            formData.businessName.trim(),

          mobileNumber:
            formData.mobileNumber.trim(),

          fullName:
            formData.fullName.trim(),

          address:
            formData.address.trim(),

          gstNumber:
            formData.gstNumber.trim(),

          gstInvoiceName:
            formData.gstInvoiceName.trim(),

          typeOfBusiness:
            formData.typeOfBusiness,

          typeOfBusinessOther:
            formData.typeOfBusinessOther.trim(),

          googleMapLink:
            formData.googleMapLink.trim(),

          transactionIdOrChequeNumber:
            formData
              .transactionIdOrChequeNumber
              .trim(),

          paymentDetails:
            formData.paymentDetails,

          paymentDetailsOther:
            formData
              .paymentDetailsOther
              .trim(),

          serviceCategory:
            formData.serviceCategory,

          googleServices:
            formData.googleServices,

          googleServicesOther:
            formData
              .googleServicesOther
              .trim(),

          otherServices:
            formData.otherServices,

          otherServicesOther:
            formData
              .otherServicesOther
              .trim()

        };


        let response;


        if (
          editingId
        ) {

          response =
            await api.put(
              `/forms/${editingId}`,
              payload
            );

        } else {

          response =
            await api.post(
              "/forms",
              payload
            );

        }


        if (
          response
            ?.data
            ?.requiresAdminApproval
        ) {

          setSuccessPopupMode(
            "pending"
          );


          setApprovalPendingMessage(
            response.data.message ||
            "This form requires admin approval. Please contact admin."
          );


          setErrors(
            {}
          );

          resetForm();
          setShowForm(false);

          return;

        }


        setSuccessPopupMode(
          "success"
        );


        const submittedMonth =
          selectedDate.slice(
            0,
            7
          );

        resetForm();

        setShowForm(false);

        fetchPendingRecords();

        if (
          selectedMonth !==
          submittedMonth
        ) {

          setSelectedMonth(
            submittedMonth
          );

        } else {

          setTimeout(
            () => {
              fetchFormsByMonth();
            },
            100
          );

        }


      } catch (error) {

        setShowSuccessPopup(
          false
        );


        setMessage(
          error.response
            ?.data
            ?.message ||
          "Failed to save form details"
        );

      }

    };


  /*
    =========================================
    FORM BALANCE
    =========================================
  */

  const getFormBalance =
    (
      item
    ) => {

      if (
        item.balanceAmount !==
        undefined &&
        item.balanceAmount !==
        null &&
        item.balanceAmount !==
        ""
      ) {

        const storedBalance =
          Number(
            item.balanceAmount
          );


        if (
          Number.isFinite(
            storedBalance
          )
        ) {

          return Number(
            Math.max(
              storedBalance,
              0
            ).toFixed(2)
          );

        }

      }


      const packageAmount =
        Number(
          item.packageAmount ||
          item.revenue ||
          0
        );


      const totalReceived =
        Number(
          item.totalReceivedAmount ||
          item.revenue ||
          0
        );


      return Number(
        Math.max(
          packageAmount -
          totalReceived,
          0
        ).toFixed(2)
      );

    };


  /*
    =========================================
    TOTALS
    =========================================
  */

  const totals =
    useMemo(() => {

      return (
        formsData.reduce(
          (
            accumulator,
            item
          ) => {

            accumulator.revenue +=
              Number(
                item.monthlyRevenue ||
                0
              );


            accumulator.exGst +=
              Number(
                item.monthlyExGst ||
                0
              );


            return accumulator;

          },

          {
            revenue: 0,
            exGst: 0
          }
        )
      );

    }, [
      formsData
    ]);


  /*
    =========================================
    PAYMENT HISTORY
    =========================================
  */

  const formatPaymentTransactions =
    (
      item
    ) => {

      const payments = [
        {
          label:
            "1st",

          date:
            item.date,

          amount:
            item.amountReceivedNow ||
            item.revenue,

          transactionIdOrChequeNumber:
            item.transactionIdOrChequeNumber,

          paymentDetails:
            item.paymentDetails
        },

        ...(
          Array.isArray(
            item.paymentHistory
          )

            ? item.paymentHistory

            : []
        ).map(
          (
            payment,
            index
          ) => ({

            label:
              `${index + 2}${index + 2 === 2
                ? "nd"
                : index + 2 === 3
                  ? "rd"
                  : "th"
              }`,

            date:
              payment.paymentDate,

            amount:
              payment.amount,

            transactionIdOrChequeNumber:
              payment.transactionIdOrChequeNumber,

            paymentDetails:
              payment.paymentDetails

          })
        )
      ];


      const visiblePayments =
        payments.filter(
          (
            payment
          ) =>
            payment.amount ||
            payment.transactionIdOrChequeNumber
        );


      if (
        visiblePayments.length ===
        0
      ) {

        return (
          <p>
            No payment transactions found.
          </p>
        );

      }


      return (
        visiblePayments.map(
          (
            payment,
            index
          ) => (

            <div
              key={`${item._id}-${index}`}
            >

              <strong>
                {payment.label}:
              </strong>{" "}

              {payment.date ||
                "-"}{" "}

              | ₹
              {Number(
                payment.amount ||
                0
              ).toFixed(2)}{" "}

              |{" "}
              {
                payment.transactionIdOrChequeNumber ||
                "-"
              }

            </div>

          )
        )
      );

    };


  /*
    =========================================
    SERVICES
    =========================================
  */

  const getFormServices =
    (
      item
    ) => {

      const services = [

        ...(
          Array.isArray(
            item.googleServices
          )
            ? item.googleServices
            : []
        ),

        ...(
          item.googleServicesOther

            ? [
              item.googleServicesOther
            ]

            : []
        ),

        ...(
          Array.isArray(
            item.otherServices
          )
            ? item.otherServices
            : []
        ),

        ...(
          item.otherServicesOther

            ? [
              item.otherServicesOther
            ]

            : []
        )

      ];


      return services.length >
        0

        ? services.join(
          ", "
        )

        : "-";

    };


  const toggleFormDetails =
    (
      id
    ) => {

      setExpandedFormId(
        (
          previousId
        ) =>
          previousId ===
            id

            ? null

            : id
      );

    };


  /*
    =========================================
    RENDER
    =========================================
  */

  return (

    <div className="forms-page">

      <div className="forms-page-card">


        {/* PAGE HEADER */}

        <div className="forms-header">

          <div className="forms-header-content">

            <h2 className="forms-title">
              Forms
            </h2>

            <p className="forms-subtitle">
              Fill pending forms, manage submitted businesses and record additional payments
            </p>

          </div>

          {!showForm && (
            <button
              type="button"
              className="btn btn-primary forms-fill-main-btn"
              onClick={() => {
                resetForm();
                setShowForm(true);

                setTimeout(() => {
                  document
                    .getElementById(
                      "telecaller-form-entry"
                    )
                    ?.scrollIntoView({
                      behavior: "smooth",
                      block: "start"
                    });
                }, 100);
              }}
            >
              + Fill Form
            </button>
          )}

        </div>


        {/* =====================================
            PENDING FORMS
        ====================================== */}

        <div className="forms-records-section">

          <div className="forms-records-header">

            <div>

              <h3>
                Remaining Forms to be Filled
              </h3>

              <p>
                Deals closed by the assigned BA that are waiting for you to fill the business form
              </p>

            </div>


            <button
              type="button"
              className="btn btn-primary"
              onClick={
                fetchPendingRecords
              }
            >
              Refresh
            </button>

          </div>


          {pendingMessage && (

            <p className="forms-message">
              {pendingMessage}
            </p>

          )}


          {pendingLoading ? (

            <p className="forms-loading">
              Loading pending forms...
            </p>

          ) : pendingRecords.length ===
            0 ? (

            <p className="forms-empty">
              No closed deals are waiting for a form.
            </p>

          ) : (

            <div className="forms-table-wrapper">

              <table className="forms-table">

                <thead>

                  <tr>

                    <th>
                      Business
                    </th>

                    <th>
                      Contact
                    </th>

                    <th>
                      Appointment
                    </th>

                    <th>
                      Closed By BA
                    </th>

                    <th>
                      Category
                    </th>

                    <th>
                      Map
                    </th>

                    <th>
                      Action
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {pendingRecords.map(
                    (
                      item
                    ) => (

                      <tr
                        key={
                          item._id
                        }
                      >

                        <td>

                          <strong>
                            {item.businessName ||
                              "-"}
                          </strong>

                        </td>


                        <td>
                          {item.contact ||
                            "-"}
                        </td>


                        <td>

                          {item.appointmentDate ||
                            "-"}{" "}

                          {item.appointmentTime ||
                            ""}

                        </td>


                        <td>

                          {item
                            .dealClosedByBaId
                            ?.name ||

                            item
                              .assignedBaId
                              ?.name ||

                            "-"}

                        </td>


                        <td>

                          {item.telecallerCategory ||
                            "-"}

                        </td>


                        <td>

                          {item.mapLink ? (

                            <a
                              href={
                                item.mapLink
                              }
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open Map
                            </a>

                          ) : (

                            "-"

                          )}

                        </td>


                        <td>

                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() =>
                              loadPendingAppointment(
                                item
                              )
                            }
                          >
                            Fill Form
                          </button>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>


        {/* =====================================
            FORM ENTRY
        ====================================== */}

        {showForm && (
          <div
            id="telecaller-form-entry"
            className="forms-layout"
          >


            <div className="forms-left-column">


              {message && (

                <p className="forms-message">
                  {message}
                </p>

              )}


              {/* BASIC DETAILS */}

              <div className="forms-section-card">

                <div className="forms-section-header">

                  <h3>
                    {isAdditionalPaymentMode
                      ? "Additional Payment"
                      : editingId
                        ? "Edit Form"
                        : "Form Details"}
                  </h3>

                </div>


                <div className="forms-grid two-column">


                  <div className="forms-field">

                    <label>
                      Select Date
                    </label>

                    <input
                      className={
                        errors.selectedDate
                          ? "input-error"
                          : ""
                      }
                      type="date"
                      value={
                        selectedDate
                      }
                      onChange={(event) =>
                        setSelectedDate(
                          event.target.value
                        )
                      }
                    />

                    {errors.selectedDate && (

                      <small className="field-error">
                        {errors.selectedDate}
                      </small>

                    )}

                  </div>


                  <div className="forms-field">

                    <label>
                      Email
                    </label>

                    <input
                      className={
                        errors.email
                          ? "input-error"
                          : ""
                      }
                      type="email"
                      name="email"
                      value={
                        formData.email
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Enter email"
                    />

                    {errors.email && (

                      <small className="field-error">
                        {errors.email}
                      </small>

                    )}

                  </div>


                  <div className="forms-field">

                    <label>
                      Payment Type
                    </label>

                    <select
                      className={
                        errors.paymentType
                          ? "input-error"
                          : ""
                      }
                      name="paymentType"
                      value={
                        formData.paymentType
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        isAdditionalPaymentMode
                      }
                    >

                      <option value="complete">
                        Complete Payment
                      </option>

                      <option value="partial">
                        Partial Payment
                      </option>

                      {isAdditionalPaymentMode && (

                        <option value="additional">
                          Additional Payment
                        </option>

                      )}

                    </select>

                    {errors.paymentType && (

                      <small className="field-error">
                        {errors.paymentType}
                      </small>

                    )}

                  </div>


                  <div className="forms-field">

                    <label>

                      {formData.paymentType ===
                        "complete"

                        ? "Revenue"

                        : "Payment Received Now"}

                    </label>

                    <input
                      className={
                        errors.revenue
                          ? "input-error"
                          : ""
                      }
                      type="number"
                      name="revenue"
                      value={
                        formData.revenue
                      }
                      onChange={
                        handleChange
                      }
                      onWheel={
                        preventNumberScroll
                      }
                      placeholder="Enter payment amount"
                      min="0"
                    />

                    {errors.revenue && (

                      <small className="field-error">
                        {errors.revenue}
                      </small>

                    )}

                  </div>


                  {formData.paymentType !==
                    "complete" && (

                      <>

                        <div className="forms-field">

                          <label>
                            Package Amount
                          </label>

                          <input
                            className={
                              errors.packageAmount
                                ? "input-error"
                                : ""
                            }
                            type="number"
                            name="packageAmount"
                            value={
                              formData.packageAmount
                            }
                            onChange={
                              handleChange
                            }
                            onWheel={
                              preventNumberScroll
                            }
                            min="0"
                            readOnly={
                              isAdditionalPaymentMode
                            }
                          />

                          {errors.packageAmount && (

                            <small className="field-error">
                              {errors.packageAmount}
                            </small>

                          )}

                        </div>


                        <div className="forms-field">

                          <label>
                            Balance Amount
                          </label>

                          <input
                            type="text"
                            value={
                              calculatedBalance !==
                                ""

                                ? `₹${calculatedBalance}`

                                : ""
                            }
                            readOnly
                          />

                        </div>


                        <div className="forms-field">

                          <label>
                            Payment Status
                          </label>

                          <input
                            type="text"
                            value={
                              currentPaymentStatus
                            }
                            readOnly
                          />

                        </div>

                      </>

                    )}


                  <div className="forms-field">

                    <label>
                      Service Category
                    </label>

                    <select
                      className={
                        errors.serviceCategory
                          ? "input-error"
                          : ""
                      }
                      name="serviceCategory"
                      value={
                        formData.serviceCategory
                      }
                      onChange={
                        handleChange
                      }
                    >

                      <option value="">
                        Select service category
                      </option>

                      <option value="googleServices">
                        Google Services
                      </option>

                      <option value="otherServices">
                        Other Services
                      </option>

                    </select>

                    {errors.serviceCategory && (

                      <small className="field-error">
                        {errors.serviceCategory}
                      </small>

                    )}

                  </div>


                  <div className="forms-field">

                    <label>
                      Ex GST Price
                    </label>

                    <input
                      type="text"
                      value={
                        exGst
                          ? `₹${exGst}`
                          : ""
                      }
                      readOnly
                    />

                  </div>


                  <div className="forms-field">

                    <label>
                      Pincode
                    </label>

                    <input
                      className={
                        errors.pincode
                          ? "input-error"
                          : ""
                      }
                      type="text"
                      name="pincode"
                      value={
                        formData.pincode
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Enter pincode"
                    />

                    {errors.pincode && (

                      <small className="field-error">
                        {errors.pincode}
                      </small>

                    )}

                  </div>


                  <div className="forms-field">

                    <label>
                      City
                    </label>

                    <input
                      className={
                        errors.city
                          ? "input-error"
                          : ""
                      }
                      type="text"
                      name="city"
                      value={
                        formData.city
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Enter city"
                    />

                    {errors.city && (

                      <small className="field-error">
                        {errors.city}
                      </small>

                    )}

                  </div>


                  <div className="forms-field">

                    <label>
                      Area
                    </label>

                    <input
                      className={
                        errors.area
                          ? "input-error"
                          : ""
                      }
                      type="text"
                      name="area"
                      value={
                        formData.area
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Enter area"
                    />

                    {errors.area && (

                      <small className="field-error">
                        {errors.area}
                      </small>

                    )}

                  </div>



                  <div className="forms-field">
                    <label>Closed By BA (Optional)</label>

                    {!formData.sourcePresentationId &&
                      !editingId &&
                      !isAdditionalPaymentMode ? (
                      <>
                        <select
                          name="closedByBaId"
                          value={formData.closedByBaId || ""}
                          onChange={(event) => {
                            const selectedId = event.target.value;

                            const selectedBa = activeBas.find(
                              (ba) => ba.userId === selectedId
                            );

                            setFormData((previous) => ({
                              ...previous,

                              closedByBaId: selectedBa?.userId || "",

                              baName: selectedBa?.name || "",

                              baId: selectedBa?.employeeId || ""
                            }));
                          }}
                        >
                          <option value="">
                            No BA — Closed Directly
                          </option>

                          {activeBas.map((ba) => (
                            <option
                              key={ba.userId}
                              value={ba.userId}
                            >
                              {ba.name}
                              {ba.employeeId ? ` (${ba.employeeId})` : ""}
                            </option>
                          ))}
                        </select>

                        {activeBasError && (
                          <small className="field-error">
                            {activeBasError}
                          </small>
                        )}
                      </>
                    ) : (
                      <input
                        type="text"
                        value={formData.baName || ""}
                        readOnly
                      />
                    )}
                  </div>

                </div>

              </div>


              {/* BUSINESS INFORMATION */}

              <div className="forms-section-card">

                <div className="forms-section-header">

                  <h3>
                    Business Information
                  </h3>

                </div>


                <div className="forms-grid two-column">


                  <div className="forms-field">

                    <label>
                      Business Name
                    </label>

                    <input
                      className={
                        errors.businessName
                          ? "input-error"
                          : ""
                      }
                      type="text"
                      name="businessName"
                      value={
                        formData.businessName
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Enter business name"
                    />

                    {errors.businessName && (

                      <small className="field-error">
                        {errors.businessName}
                      </small>

                    )}

                  </div>


                  <div className="forms-field">

                    <label>
                      Mobile Number
                    </label>

                    <input
                      className={
                        errors.mobileNumber
                          ? "input-error"
                          : ""
                      }
                      type="text"
                      name="mobileNumber"
                      value={
                        formData.mobileNumber
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Enter mobile number"
                    />

                    {errors.mobileNumber && (

                      <small className="field-error">
                        {errors.mobileNumber}
                      </small>

                    )}

                  </div>


                  <div className="forms-field">

                    <label>
                      Full Name
                    </label>

                    <input
                      className={
                        errors.fullName
                          ? "input-error"
                          : ""
                      }
                      type="text"
                      name="fullName"
                      value={
                        formData.fullName
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Enter full name"
                    />

                    {errors.fullName && (

                      <small className="field-error">
                        {errors.fullName}
                      </small>

                    )}

                  </div>


                  <div className="forms-field">

                    <label>
                      GST Number
                    </label>

                    <input
                      className={
                        errors.gstNumber
                          ? "input-error"
                          : ""
                      }
                      type="text"
                      name="gstNumber"
                      value={
                        formData.gstNumber
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Enter GST number"
                    />

                    {errors.gstNumber && (

                      <small className="field-error">
                        {errors.gstNumber}
                      </small>

                    )}

                  </div>


                  <div className="forms-field">

                    <label>
                      GST Invoice Name
                    </label>

                    <input
                      className={
                        errors.gstInvoiceName
                          ? "input-error"
                          : ""
                      }
                      type="text"
                      name="gstInvoiceName"
                      value={
                        formData.gstInvoiceName
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Enter GST invoice name"
                    />

                    {errors.gstInvoiceName && (

                      <small className="field-error">
                        {errors.gstInvoiceName}
                      </small>

                    )}

                  </div>


                  <div className="forms-field">

                    <label>
                      Type of Business
                    </label>

                    <select
                      className={
                        errors.typeOfBusiness
                          ? "input-error"
                          : ""
                      }
                      name="typeOfBusiness"
                      value={
                        formData.typeOfBusiness
                      }
                      onChange={
                        handleChange
                      }
                    >

                      <option value="">
                        Select type of business
                      </option>

                      <option value="Proprietor">
                        Proprietor
                      </option>

                      <option value="Partnership">
                        Partnership
                      </option>

                      <option value="PVT LTD">
                        PVT LTD
                      </option>

                      <option value="Other">
                        Other
                      </option>

                    </select>

                    {errors.typeOfBusiness && (

                      <small className="field-error">
                        {errors.typeOfBusiness}
                      </small>

                    )}

                  </div>


                  {formData.typeOfBusiness ===
                    "Other" && (

                      <div className="forms-field">

                        <label>
                          Other Business Type
                        </label>

                        <input
                          className={
                            errors.typeOfBusinessOther
                              ? "input-error"
                              : ""
                          }
                          type="text"
                          name="typeOfBusinessOther"
                          value={
                            formData.typeOfBusinessOther
                          }
                          onChange={
                            handleChange
                          }
                        />

                        {errors.typeOfBusinessOther && (

                          <small className="field-error">
                            {errors.typeOfBusinessOther}
                          </small>

                        )}

                      </div>

                    )}


                  <div className="forms-field full-width">

                    <label>
                      Address
                    </label>

                    <textarea
                      className={`forms-textarea ${errors.address
                        ? "input-error"
                        : ""
                        }`}
                      name="address"
                      value={
                        formData.address
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Enter address"
                    />

                    {errors.address && (

                      <small className="field-error">
                        {errors.address}
                      </small>

                    )}

                  </div>


                  <div className="forms-field full-width">

                    <label>
                      Google Map Link
                    </label>

                    <input
                      className={
                        errors.googleMapLink
                          ? "input-error"
                          : ""
                      }
                      type="text"
                      name="googleMapLink"
                      value={
                        formData.googleMapLink
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Enter Google Map link"
                    />

                    {errors.googleMapLink && (

                      <small className="field-error">
                        {errors.googleMapLink}
                      </small>

                    )}

                  </div>

                </div>

              </div>


              {/* PAYMENT */}

              <div className="forms-section-card">

                <div className="forms-section-header">

                  <h3>
                    Payment Details
                  </h3>

                </div>


                <div className="forms-grid two-column">


                  <div className="forms-field">

                    <label>
                      Transaction ID / Cheque Number
                    </label>

                    <input
                      className={
                        errors.transactionIdOrChequeNumber
                          ? "input-error"
                          : ""
                      }
                      type="text"
                      name="transactionIdOrChequeNumber"
                      value={
                        formData.transactionIdOrChequeNumber
                      }
                      onChange={
                        handleChange
                      }
                    />

                    {errors.transactionIdOrChequeNumber && (

                      <small className="field-error">
                        {errors.transactionIdOrChequeNumber}
                      </small>

                    )}

                  </div>


                  <div className="forms-field">

                    <label>
                      Payment Details
                    </label>

                    <select
                      className={
                        errors.paymentDetails
                          ? "input-error"
                          : ""
                      }
                      name="paymentDetails"
                      value={
                        formData.paymentDetails
                      }
                      onChange={
                        handleChange
                      }
                    >

                      <option value="">
                        Select payment mode
                      </option>

                      <option value="Cheque">
                        Cheque
                      </option>

                      <option value="UPI">
                        UPI
                      </option>

                      <option value="RTGS">
                        RTGS
                      </option>

                      <option value="NEFT">
                        NEFT
                      </option>

                      <option value="Other">
                        Other
                      </option>

                    </select>

                    {errors.paymentDetails && (

                      <small className="field-error">
                        {errors.paymentDetails}
                      </small>

                    )}

                  </div>


                  {formData.paymentDetails ===
                    "Other" && (

                      <div className="forms-field full-width">

                        <label>
                          Other Payment Details
                        </label>

                        <input
                          className={
                            errors.paymentDetailsOther
                              ? "input-error"
                              : ""
                          }
                          type="text"
                          name="paymentDetailsOther"
                          value={
                            formData.paymentDetailsOther
                          }
                          onChange={
                            handleChange
                          }
                        />

                        {errors.paymentDetailsOther && (

                          <small className="field-error">
                            {errors.paymentDetailsOther}
                          </small>

                        )}

                      </div>

                    )}

                </div>

              </div>


              {/* SERVICES */}

              <div className="forms-section-card">

                <div className="forms-section-header">

                  <h3>
                    Services
                  </h3>

                </div>


                <div className="forms-services-wrap">


                  {formData.serviceCategory ===
                    "googleServices" && (

                      <div className="forms-service-block">

                        <label className="forms-service-label">
                          Google Services
                        </label>


                        <div className="forms-checkbox-group">

                          {GOOGLE_SERVICE_OPTIONS.map(
                            (
                              service
                            ) => (

                              <label
                                key={
                                  service
                                }
                                className="forms-checkbox-card"
                              >

                                <input
                                  type="checkbox"
                                  checked={
                                    formData.googleServices.includes(
                                      service
                                    )
                                  }
                                  onChange={() =>
                                    handleServiceCheckboxChange(
                                      "googleServices",
                                      service
                                    )
                                  }
                                />

                                <span>
                                  {service}
                                </span>

                              </label>

                            )
                          )}

                        </div>


                        {errors.googleServices && (

                          <small className="field-error">
                            {errors.googleServices}
                          </small>

                        )}


                        {formData.googleServices.includes(
                          "Others"
                        ) && (

                            <div className="forms-field service-other-field">

                              <label>
                                Other Google Service
                              </label>

                              <textarea
                                className={`forms-textarea ${errors.googleServicesOther
                                  ? "input-error"
                                  : ""
                                  }`}
                                name="googleServicesOther"
                                value={
                                  formData.googleServicesOther
                                }
                                onChange={
                                  handleChange
                                }
                              />

                              {errors.googleServicesOther && (

                                <small className="field-error">
                                  {errors.googleServicesOther}
                                </small>

                              )}

                            </div>

                          )}

                      </div>

                    )}


                  {formData.serviceCategory ===
                    "otherServices" && (

                      <div className="forms-service-block">

                        <label className="forms-service-label">
                          Other Services
                        </label>


                        <div className="forms-checkbox-group">

                          {OTHER_SERVICE_OPTIONS.map(
                            (
                              service
                            ) => (

                              <label
                                key={
                                  service
                                }
                                className="forms-checkbox-card"
                              >

                                <input
                                  type="checkbox"
                                  checked={
                                    formData.otherServices.includes(
                                      service
                                    )
                                  }
                                  onChange={() =>
                                    handleServiceCheckboxChange(
                                      "otherServices",
                                      service
                                    )
                                  }
                                />

                                <span>
                                  {service}
                                </span>

                              </label>

                            )
                          )}

                        </div>


                        {errors.otherServices && (

                          <small className="field-error">
                            {errors.otherServices}
                          </small>

                        )}


                        {formData.otherServices.includes(
                          "Other Services"
                        ) && (

                            <div className="forms-field service-other-field">

                              <label>
                                Other Service Details
                              </label>

                              <textarea
                                className={`forms-textarea ${errors.otherServicesOther
                                  ? "input-error"
                                  : ""
                                  }`}
                                name="otherServicesOther"
                                value={
                                  formData.otherServicesOther
                                }
                                onChange={
                                  handleChange
                                }
                              />

                              {errors.otherServicesOther && (

                                <small className="field-error">
                                  {errors.otherServicesOther}
                                </small>

                              )}

                            </div>

                          )}

                      </div>

                    )}

                </div>


                {/* GOOGLE ACCESS */}

                {requiresGoogleAccess && (

                  <div className="forms-access-section">

                    <div className="forms-section-header">

                      <h3>
                        Google Business Access
                      </h3>

                    </div>


                    <div className="forms-grid two-column">


                      <div className="forms-field">

                        <label>
                          Access Email ID
                        </label>

                        <input
                          className={
                            errors.accessEmail
                              ? "input-error"
                              : ""
                          }
                          type="email"
                          name="accessEmail"
                          value={
                            formData.accessEmail
                          }
                          onChange={
                            handleChange
                          }
                        />

                        {errors.accessEmail && (

                          <small className="field-error">
                            {errors.accessEmail}
                          </small>

                        )}

                      </div>


                      <div className="forms-field">

                        <label>
                          Access Password
                        </label>


                        <div className="forms-password-wrapper">

                          <input
                            className={
                              errors.accessPassword
                                ? "input-error"
                                : ""
                            }
                            type={
                              showAccessPassword
                                ? "text"
                                : "password"
                            }
                            name="accessPassword"
                            value={
                              formData.accessPassword
                            }
                            onChange={
                              handleChange
                            }
                            placeholder={
                              formData.hasAccessPassword

                                ? "Leave blank to keep existing password"

                                : "Enter Google access password"
                            }
                          />


                          <button
                            type="button"
                            className="forms-password-eye"
                            onClick={() =>
                              setShowAccessPassword(
                                (
                                  previous
                                ) =>
                                  !previous
                              )
                            }
                          >

                            {showAccessPassword
                              ? (
                                <FaEyeSlash />
                              )
                              : (
                                <FaEye />
                              )}

                          </button>

                        </div>


                        {errors.accessPassword && (

                          <small className="field-error">
                            {errors.accessPassword}
                          </small>

                        )}

                      </div>

                    </div>

                  </div>

                )}

              </div>


              {/* ACTIONS */}

              <div className="forms-actions">

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={
                    handleSave
                  }
                >

                  {isAdditionalPaymentMode
                    ? "Add Payment"
                    : editingId
                      ? "Update Form"
                      : "Save Form"}

                </button>



                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                >
                  Cancel
                </button>

              </div>

            </div>


            {/* SUMMARY */}

            <div className="forms-right-column">

              <div className="forms-summary-card">

                <h3>
                  Current Entry Summary
                </h3>


                <div className="forms-summary-row">

                  <span>
                    Payment Received
                  </span>

                  <strong>

                    {formData.revenue
                      ? `₹${Number(
                        formData.revenue
                      ).toFixed(2)}`
                      : "-"}

                  </strong>

                </div>


                <div className="forms-summary-row">

                  <span>
                    Package Amount
                  </span>

                  <strong>

                    {formData.packageAmount ||
                      formData.revenue

                      ? `₹${Number(
                        formData.packageAmount ||
                        formData.revenue
                      ).toFixed(2)}`

                      : "-"}

                  </strong>

                </div>


                <div className="forms-summary-row">

                  <span>
                    Balance
                  </span>

                  <strong>

                    {calculatedBalance !==
                      ""

                      ? `₹${calculatedBalance}`

                      : "-"}

                  </strong>

                </div>


                <div className="forms-summary-row">

                  <span>
                    Payment Status
                  </span>

                  <strong>
                    {currentPaymentStatus}
                  </strong>

                </div>


                <div className="forms-summary-row">

                  <span>
                    Ex GST
                  </span>

                  <strong>

                    {exGst
                      ? `₹${exGst}`
                      : "-"}

                  </strong>

                </div>


                <div className="forms-summary-divider" />


                <div className="forms-summary-row">

                  <span>
                    Business
                  </span>

                  <strong>
                    {formData.businessName ||
                      "-"}
                  </strong>

                </div>


                <div className="forms-summary-row">

                  <span>
                    Closed By BA
                  </span>

                  <strong>
                    {formData.baName ||
                      "-"}
                  </strong>

                </div>


                <div className="forms-summary-row">

                  <span>
                    Selected Date
                  </span>

                  <strong>
                    {selectedDate}
                  </strong>

                </div>

              </div>


              {/* MONTHLY TOTAL */}

              <div className="forms-summary-card monthly-totals-card">

                <h3>
                  Monthly Totals
                </h3>


                <div className="forms-summary-row">

                  <span>
                    Revenue Received
                  </span>

                  <strong>
                    ₹
                    {totals.revenue.toFixed(
                      2
                    )}
                  </strong>

                </div>


                <div className="forms-summary-row">

                  <span>
                    Ex GST
                  </span>

                  <strong>
                    ₹
                    {totals.exGst.toFixed(
                      2
                    )}
                  </strong>

                </div>

              </div>

            </div>

          </div>
        )}


        {/* =====================================
            FILLED FORMS
        ====================================== */}

        <div className="forms-records-section">

          <div className="forms-records-header">

            <div>

              <h3>
                Monthly Filled Forms
              </h3>

              <p>
                Review submitted forms and manage additional payments
              </p>

            </div>


            <div className="forms-month-filter">

              <div className="forms-month-box">

                <label>
                  Select Month
                </label>

                <input
                  type="month"
                  value={
                    selectedMonth
                  }
                  onChange={(event) =>
                    setSelectedMonth(
                      event.target.value
                    )
                  }
                />

              </div>


              <button
                type="button"
                className="btn btn-primary"
                onClick={
                  fetchFormsByMonth
                }
              >
                Refresh
              </button>

            </div>

          </div>


          {loading ? (

            <p className="forms-loading">
              Loading forms data...
            </p>

          ) : formsData.length ===
            0 ? (

            <p className="forms-empty">
              No form records found for this month.
            </p>

          ) : (

            <div className="forms-table-wrapper">

              <table className="forms-table">

                <thead>

                  <tr>

                    <th>
                      Date
                    </th>

                    <th>
                      Business
                    </th>

                    <th>
                      Closed By BA
                    </th>

                    <th>
                      Package
                    </th>

                    <th>
                      Received
                    </th>

                    <th>
                      Balance
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Details
                    </th>

                    <th>
                      Action
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {formsData.map(
                    (
                      item
                    ) => (

                      <Fragment
                        key={
                          item._id
                        }
                      >

                        <tr className="forms-main-row">


                          <td>
                            {item.date ||
                              "-"}
                          </td>


                          <td className="forms-business-cell">

                            <strong>
                              {item.businessName ||
                                "-"}
                            </strong>

                            <span>
                              {item.mobileNumber ||
                                "-"}
                            </span>

                          </td>


                          <td>
                            {item.baName ||
                              "-"}
                          </td>


                          <td>

                            ₹
                            {Number(
                              item.packageAmount ||
                              item.revenue ||
                              0
                            ).toLocaleString(
                              "en-IN"
                            )}

                          </td>


                          <td>

                            ₹
                            {Number(
                              item.totalReceivedAmount ||
                              item.revenue ||
                              0
                            ).toLocaleString(
                              "en-IN"
                            )}

                          </td>


                          <td>

                            ₹
                            {getFormBalance(
                              item
                            ).toLocaleString(
                              "en-IN"
                            )}

                          </td>


                          <td>

                            {getFormBalance(
                              item
                            ) >
                              0

                              ? "Partially Paid"

                              : "Paid"}

                          </td>


                          <td>

                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() =>
                                toggleFormDetails(
                                  item._id
                                )
                              }
                            >

                              {expandedFormId ===
                                item._id

                                ? "Hide Details"

                                : "View Details"}

                            </button>

                          </td>


                          <td>

                            <div className="forms-action-group">


                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() =>
                                  handleEdit(
                                    item
                                  )
                                }
                              >
                                Edit
                              </button>


                              {getFormBalance(
                                item
                              ) >
                                0 && (

                                  <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() =>
                                      handleAddPayment(
                                        item
                                      )
                                    }
                                  >
                                    Add Payment
                                  </button>

                                )}

                            </div>

                          </td>

                        </tr>


                        {/* DETAILS */}

                        {expandedFormId ===
                          item._id && (

                            <tr className="forms-details-row">

                              <td colSpan="9">

                                <div className="forms-details-panel">


                                  <div className="forms-details-section">

                                    <h4>
                                      Payment Details
                                    </h4>


                                    <div className="forms-details-grid">


                                      <p>

                                        <span>
                                          Package Amount
                                        </span>

                                        <strong>

                                          ₹
                                          {Number(
                                            item.packageAmount ||
                                            item.revenue ||
                                            0
                                          ).toLocaleString(
                                            "en-IN"
                                          )}

                                        </strong>

                                      </p>


                                      <p>

                                        <span>
                                          Total Received
                                        </span>

                                        <strong>

                                          ₹
                                          {Number(
                                            item.totalReceivedAmount ||
                                            item.revenue ||
                                            0
                                          ).toLocaleString(
                                            "en-IN"
                                          )}

                                        </strong>

                                      </p>


                                      <p>

                                        <span>
                                          Balance
                                        </span>

                                        <strong>

                                          ₹
                                          {getFormBalance(
                                            item
                                          ).toLocaleString(
                                            "en-IN"
                                          )}

                                        </strong>

                                      </p>


                                      <p>

                                        <span>
                                          Payment Status
                                        </span>

                                        <strong>

                                          {getFormBalance(
                                            item
                                          ) >
                                            0

                                            ? "Partially Paid"

                                            : "Paid"}

                                        </strong>

                                      </p>


                                      <p>

                                        <span>
                                          Ex GST
                                        </span>

                                        <strong>

                                          ₹
                                          {Number(
                                            item.exGst ||
                                            0
                                          ).toLocaleString(
                                            "en-IN"
                                          )}

                                        </strong>

                                      </p>

                                    </div>


                                    <div className="forms-payment-history-box">

                                      <span>
                                        Payment Transactions
                                      </span>

                                      <div>

                                        {formatPaymentTransactions(
                                          item
                                        )}

                                      </div>

                                    </div>

                                  </div>


                                  <div className="forms-details-section">

                                    <h4>
                                      Business Details
                                    </h4>


                                    <div className="forms-details-grid">


                                      <p>

                                        <span>
                                          Closed By BA
                                        </span>

                                        <strong>
                                          {item.baName ||
                                            "-"}
                                        </strong>

                                      </p>


                                      <p>

                                        <span>
                                          BA ID
                                        </span>

                                        <strong>
                                          {item.baId ||
                                            "-"}
                                        </strong>

                                      </p>


                                      <p>

                                        <span>
                                          Owner
                                        </span>

                                        <strong>
                                          {item.fullName ||
                                            "-"}
                                        </strong>

                                      </p>


                                      <p>

                                        <span>
                                          Mobile
                                        </span>

                                        <strong>
                                          {item.mobileNumber ||
                                            "-"}
                                        </strong>

                                      </p>


                                      <p>

                                        <span>
                                          City
                                        </span>

                                        <strong>
                                          {item.city ||
                                            "-"}
                                        </strong>

                                      </p>


                                      <p>

                                        <span>
                                          Area
                                        </span>

                                        <strong>
                                          {item.area ||
                                            "-"}
                                        </strong>

                                      </p>


                                      <p>

                                        <span>
                                          GST Number
                                        </span>

                                        <strong>
                                          {item.gstNumber ||
                                            "-"}
                                        </strong>

                                      </p>


                                      <p>

                                        <span>
                                          GST Invoice Name
                                        </span>

                                        <strong>
                                          {item.gstInvoiceName ||
                                            "-"}
                                        </strong>

                                      </p>

                                    </div>


                                    <div className="forms-details-full">

                                      <span>
                                        Address
                                      </span>

                                      <strong>
                                        {item.address ||
                                          "-"}
                                      </strong>

                                    </div>


                                    <div className="forms-details-full">

                                      <span>
                                        Google Map
                                      </span>

                                      {item.googleMapLink ? (

                                        <a
                                          href={
                                            item.googleMapLink
                                          }
                                          target="_blank"
                                          rel="noreferrer"
                                        >
                                          Open Map
                                        </a>

                                      ) : (

                                        <strong>
                                          -
                                        </strong>

                                      )}

                                    </div>

                                  </div>


                                  <div className="forms-details-section">

                                    <h4>
                                      Service Details
                                    </h4>


                                    <div className="forms-details-full">

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


                                    <div className="forms-details-full">

                                      <span>
                                        Selected Services
                                      </span>

                                      <strong>

                                        {getFormServices(
                                          item
                                        )}

                                      </strong>

                                    </div>

                                  </div>


                                </div>

                              </td>

                            </tr>

                          )}

                      </Fragment>

                    )
                  )}

                </tbody>


                <tfoot>

                  <tr>

                    <th
                      colSpan="3"
                      className="forms-total-title"
                    >
                      Monthly Total
                    </th>


                    <th className="forms-total-cell">

                      <span>
                        Revenue
                      </span>

                      <strong>
                        ₹
                        {totals.revenue.toFixed(
                          2
                        )}
                      </strong>

                    </th>


                    <th className="forms-total-cell">

                      <span>
                        Ex GST
                      </span>

                      <strong>
                        ₹
                        {totals.exGst.toFixed(
                          2
                        )}
                      </strong>

                    </th>


                    <th
                      colSpan="4"
                    />

                  </tr>

                </tfoot>

              </table>

            </div>

          )}

        </div>

      </div>


      {/* =====================================
          SUCCESS POPUP
      ====================================== */}

      {showSuccessPopup && (

        <div className="popup-overlay">

          <div className="success-popup">


            {successPopupMode ===
              "success" && (

                <>

                  <div className="confetti">

                    {Array.from({
                      length: 16
                    }).map(
                      (
                        _,
                        index
                      ) => (

                        <span
                          key={
                            index
                          }
                        />

                      )
                    )}

                  </div>


                  <h2>
                    🎉 Congratulations!
                  </h2>


                  <p>

                    {isAdditionalPaymentMode

                      ? "Payment added successfully"

                      : editingId

                        ? "Form updated successfully"

                        : "Form submitted successfully"}

                  </p>

                </>

              )}


            {successPopupMode ===
              "saving" && (

                <>

                  <h2>
                    Saving...
                  </h2>

                  <p>
                    Please wait while we save the form.
                  </p>

                </>

              )}


            {successPopupMode ===
              "pending" && (

                <>

                  <h2>
                    ⏳ Approval Pending
                  </h2>

                  <p>

                    {approvalPendingMessage ||
                      "This form requires admin approval. Please contact admin."}

                  </p>

                  <p>
                    Once admin approves, the form will be saved.
                  </p>

                </>

              )}


            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                setShowSuccessPopup(
                  false
                )
              }
            >
              OK
            </button>

          </div>

        </div>

      )}

    </div>

  );

};


export default TelecallerFormPage;