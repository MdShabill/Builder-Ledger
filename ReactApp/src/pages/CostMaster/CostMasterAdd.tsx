import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {getCostMasters,getActiveCost,addCostMaster,} from "../../services/costMasterService";
import type {ServiceTypeOption,} from "../../services/costMasterService";
import { useSite } from "../../context/Sitecontext";

function CostMasterAdd() {
  const navigate = useNavigate();

  const { selectedSite } = useSite();

  const siteId = selectedSite?.id ?? 0;

  const [serviceTypes, setServiceTypes] = useState<ServiceTypeOption[]>([]);

  const [serviceTypeId, setServiceTypeId] = useState("");

  const [cost, setCost] = useState("");

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const [errorMessage, setErrorMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);


  // Load only service types
  useEffect(() => {getCostMasters(siteId)
      .then((result) => {setServiceTypes(result.serviceTypes);
      setServiceTypeId("");
        setCost("");
      })

      .catch(() =>setErrorMessage("Failed to load service types. Check connection."));
    }, [siteId]);


  // Load cost after selecting service type
  const handleServiceTypeChange = async (id: string) => {
        setServiceTypeId(id);
        setCost("");
        setErrorMessage("");
        if (!id)
        return;
      try {const active =
          await getActiveCost(siteId,Number(id));

        if (active)setCost(String(active.cost));
          } catch {setCost("");}};


  const validate = () => {

    if (
      !date ||
      !serviceTypeId
    ) {
      return "Please enter valid inputs";
    }

    if (
      !cost ||
      Number(cost) <= 0 ||
      !/^\d+(\.\d{1,2})?$/.test(cost)
    ) {
      return "Cost must be valid";
    }

    return null;
  };


  const handleSubmit =
    async (
      e: React.FormEvent
    ) => {

      e.preventDefault();

      const validation =
        validate();

      if (validation) {

        setErrorMessage(
          validation
        );

        return;
      }

      setSubmitting(true);

      try {

        await addCostMaster(
          siteId,
          {
            serviceTypeId:
              Number(
                serviceTypeId
              ),

            cost:
              Number(
                cost
              ),

            date,
          }
        );

        navigate(
          "/cost-master",
          {
            state: {
              success:
                "Add New Cost Master Successful",
            },
          }
        );

      } catch (err) {

        setErrorMessage(
          (err as Error)
            .message
        );

      } finally {

        setSubmitting(
          false
        );
      }
    };


  return (
    <div
      style={{
        background:
          "linear-gradient(180deg,#1E3A5F,#0F172A)",

        minHeight:
          "100vh",

        padding:
          "80px 20px",
      }}
    >

      <div
        style={{
          maxWidth:
            "550px",

          margin:
            "0 auto",

          background:
            "#F8FAFC",

          padding:
            "40px",

          borderRadius:
            "20px",

          boxShadow:
            "0 15px 40px rgba(0,0,0,.25)",
        }}
      >

        <h1
          style={{
            textAlign:
              "center",

            color:
              "#14213D",

            marginBottom:
              "35px",
          }}
        >
          Add Cost
        </h1>


        {errorMessage && (
          <div
            style={{
              background:
                "#FEE2E2",

              color:
                "#991B1B",

              padding:
                "12px",

              borderRadius:
                "10px",

              marginBottom:
                "20px",
            }}
          >
            {errorMessage}
          </div>
        )}


        <form
          onSubmit={
            handleSubmit
          }
        >

          <div
            style={{
              marginBottom:
                "22px",
            }}
          >

            <label
              style={{
                display:
                  "block",

                fontWeight:
                  700,

                marginBottom:
                  "8px",
              }}
            >
              Date
            </label>

            <input
              type="date"
              value={date}
              onChange={(e) =>
                setDate(
                  e.target.value
                )
              }

              style={{
                width:
                  "100%",

                padding:
                  "14px",

                borderRadius:
                  "14px",

                border:
                  "1px solid #CBD5E1",
              }}
            />

          </div>


          <div
            style={{
              marginBottom:
                "22px",
            }}
          >

            <label
              style={{
                display:
                  "block",

                fontWeight:
                  700,

                marginBottom:
                  "8px",
              }}
            >
              Service Type
            </label>

            <select
              value={
                serviceTypeId
              }

              onChange={(e) =>
                handleServiceTypeChange(
                  e.target.value
                )
              }

              style={{
                width:
                  "100%",

                padding:
                  "14px",

                borderRadius:
                  "14px",

                border:
                  "1px solid #CBD5E1",
              }}
            >

              <option value="">
                Select Service Type
              </option>

              {serviceTypes.map(
                (s) => (

                  <option
                    key={
                      s.id
                    }

                    value={
                      s.id
                    }
                  >
                    {s.name}
                  </option>
                )
              )}

            </select>

          </div>


          <div
            style={{
              marginBottom:
                "30px",
            }}
          >

            <label
              style={{
                display:
                  "block",

                fontWeight:
                  700,

                marginBottom:
                  "8px",
              }}
            >
              Cost
            </label>

            <input
              type="number"

              value={
                cost
              }

              onChange={(e) =>
                setCost(
                  e.target.value
                )
              }

              placeholder="Enter Cost"

              style={{
                width:
                  "100%",

                padding:
                  "14px",

                borderRadius:
                  "14px",

                border:
                  "1px solid #CBD5E1",
              }}
            />

          </div>


          <div
            style={{
              display:
                "flex",

              justifyContent:
                "flex-end",

              gap:
                "14px",
            }}
          >

            <Link
              to="/cost-master"

              style={{
                padding:
                  "12px 28px",

                border:
                  "1px solid #CBD5E1",

                borderRadius:
                  "14px",

                textDecoration:
                  "none",

                color:
                  "#64748B",
              }}
            >
              Cancel
            </Link>


            <button
              type="submit"

              disabled={
                submitting
              }

              style={{
                background:
                  "#F59E0B",

                color:
                  "#fff",

                padding:
                  "12px 32px",

                border:
                  "none",

                borderRadius:
                  "14px",

                cursor:
                  "pointer",
              }}
            >
              {
                submitting
                  ? "Adding..."
                  : "Add"
              }

            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default CostMasterAdd;