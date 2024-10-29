import { json, LoaderFunction, ActionFunction } from "@remix-run/node";
import { useLoaderData, Form, useActionData, useNavigation } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { requireUserId, getUser } from "~/utils/session.server";
import { livelihoodSchema } from "~/utils/validationSchemas";
import { ErrorBoundary } from "~/components/ErrorBoundary";
import { handleApiError } from "~/utils/apiErrorHandler";
import { z } from "zod";

export const loader: LoaderFunction = async ({ request }) => {
  await requireUserId(request);
  const user = await getUser(request);
  const livelihoods = await db.livelihood.findMany({ include: { Project: true } });
  const projects = await db.project.findMany();
  return json({ livelihoods, projects, user });
};

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const user = await getUser(request);

  if (user?.role !== "ADMIN") {
    return json({ error: "Not authorized" }, { status: 403 });
  }

  const formData = Object.fromEntries(await request.formData());
  
  try {
    const validatedData = livelihoodSchema.parse({
      ...formData,
      projectId: parseInt(formData.projectId as string),
      grantAmountReceived: parseFloat(formData.grantAmountReceived as string),
      subsequentGrantAmount: parseFloat(formData.subsequentGrantAmount as string),
      disability: formData.disability === "true",
    });

    const newLivelihood = await db.livelihood.create({
      data: validatedData,
    });

    return json({ newLivelihood });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json({ errors: error.errors }, { status: 400 });
    }
    return handleApiError(error);
  }
};

export default function Livelihood() {
  const { livelihoods, projects, user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
      <div style={{
        backgroundColor: "#f8f9fa",
        borderRadius: "15px",
        padding: "2rem",
        marginBottom: "2rem",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
      }}>
        <h1 style={{
          color: "#2c3e50",
          marginBottom: "1rem",
          fontSize: "2rem",
          fontWeight: "bold"
        }}>Livelihood Support Program</h1>
        <p style={{
          color: "#666",
          marginBottom: "2rem"
        }}>Welcome, {user?.name} ({user?.role}) - Track and manage livelihood support initiatives</p>

        <Form method="post" style={{ display: "grid", gap: "1.5rem" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "1.5rem"
          }}>
            {/* Project Selection */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label htmlFor="projectId" style={{
                color: "#2c3e50",
                fontWeight: "500",
                fontSize: "0.9rem"
              }}>Project:</label>
              <select 
                id="projectId" 
                name="projectId" 
                required
                style={{
                  padding: "0.75rem",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "white",
                  fontSize: "0.9rem"
                }}
              >
                {projects.map((project: { id: number; projectName: string }) => (
                  <option key={project.id} value={project.id}>{project.projectName}</option>
                ))}
              </select>
            </div>

            {/* Participant Name */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label htmlFor="participantName" style={{
                color: "#2c3e50",
                fontWeight: "500",
                fontSize: "0.9rem"
              }}>Participant Name:</label>
              <input 
                type="text" 
                id="participantName" 
                name="participantName" 
                required
                style={{
                  padding: "0.75rem",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  fontSize: "0.9rem"
                }}
              />
            </div>

            {/* Location */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label htmlFor="location" style={{
                color: "#2c3e50",
                fontWeight: "500",
                fontSize: "0.9rem"
              }}>Location:</label>
              <input 
                type="text" 
                id="location" 
                name="location" 
                required
                style={{
                  padding: "0.75rem",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  fontSize: "0.9rem"
                }}
              />
            </div>

            {/* Demographics Section */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label htmlFor="disaggregatedSex" style={{
                color: "#2c3e50",
                fontWeight: "500",
                fontSize: "0.9rem"
              }}>Gender:</label>
              <select 
                id="disaggregatedSex" 
                name="disaggregatedSex" 
                required
                style={{
                  padding: "0.75rem",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "white",
                  fontSize: "0.9rem"
                }}
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label htmlFor="disability" style={{
                color: "#2c3e50",
                fontWeight: "500",
                fontSize: "0.9rem"
              }}>Disability:</label>
              <select 
                id="disability" 
                name="disability" 
                required
                style={{
                  padding: "0.75rem",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "white",
                  fontSize: "0.9rem"
                }}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label htmlFor="ageGroup" style={{
                color: "#2c3e50",
                fontWeight: "500",
                fontSize: "0.9rem"
              }}>Age Group:</label>
              <select 
                id="ageGroup" 
                name="ageGroup" 
                required
                style={{
                  padding: "0.75rem",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "white",
                  fontSize: "0.9rem"
                }}
              >
                <option value="GROUP_18_29">18-29</option>
                <option value="GROUP_30_44">30-44</option>
                <option value="GROUP_45_54">45-54</option>
                <option value="GROUP_55_64">55-64</option>
                <option value="GROUP_65_PLUS">65+</option>
              </select>
            </div>

            {/* Grant Information */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label htmlFor="grantAmountReceived" style={{
                color: "#2c3e50",
                fontWeight: "500",
                fontSize: "0.9rem"
              }}>Grant Amount Received:</label>
              <input 
                type="number" 
                id="grantAmountReceived" 
                name="grantAmountReceived" 
                step="0.01" 
                required
                style={{
                  padding: "0.75rem",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  fontSize: "0.9rem"
                }}
              />
            </div>
          </div>

          {/* Textarea Section */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "1.5rem",
            marginTop: "1rem"
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label htmlFor="purpose" style={{
                color: "#2c3e50",
                fontWeight: "500",
                fontSize: "0.9rem"
              }}>Purpose of Grant:</label>
              <textarea 
                id="purpose" 
                name="purpose" 
                required
                style={{
                  padding: "0.75rem",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  minHeight: "100px",
                  resize: "vertical",
                  fontSize: "0.9rem"
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label htmlFor="progress1" style={{
                color: "#2c3e50",
                fontWeight: "500",
                fontSize: "0.9rem"
              }}>Initial Progress:</label>
              <textarea 
                id="progress1" 
                name="progress1" 
                required
                style={{
                  padding: "0.75rem",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  minHeight: "100px",
                  resize: "vertical",
                  fontSize: "0.9rem"
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label htmlFor="progress2" style={{
                color: "#2c3e50",
                fontWeight: "500",
                fontSize: "0.9rem"
              }}>Follow-up Progress:</label>
              <textarea 
                id="progress2" 
                name="progress2" 
                required
                style={{
                  padding: "0.75rem",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  minHeight: "100px",
                  resize: "vertical",
                  fontSize: "0.9rem"
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label htmlFor="outcome" style={{
                color: "#2c3e50",
                fontWeight: "500",
                fontSize: "0.9rem"
              }}>Final Outcome:</label>
              <textarea 
                id="outcome" 
                name="outcome" 
                required
                style={{
                  padding: "0.75rem",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  minHeight: "100px",
                  resize: "vertical",
                  fontSize: "0.9rem"
                }}
              />
            </div>
          </div>

          {/* Subsequent Grant */}
          <div style={{ marginTop: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: "300px" }}>
              <label htmlFor="subsequentGrantAmount" style={{
                color: "#2c3e50",
                fontWeight: "500",
                fontSize: "0.9rem"
              }}>Subsequent Grant Amount:</label>
              <input 
                type="number" 
                id="subsequentGrantAmount" 
                name="subsequentGrantAmount" 
                step="0.01"
                style={{
                  padding: "0.75rem",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  fontSize: "0.9rem"
                }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={navigation.state === "submitting"}
            style={{
              backgroundColor: "#3498db",
              color: "white",
              padding: "1rem 2rem",
              borderRadius: "8px",
              border: "none",
              fontSize: "1rem",
              fontWeight: "500",
              cursor: navigation.state === "submitting" ? "not-allowed" : "pointer",
              opacity: navigation.state === "submitting" ? 0.7 : 1,
              marginTop: "1rem"
            }}
          >
            {navigation.state === "submitting" ? "Saving..." : "Submit Livelihood Support"}
          </button>
        </Form>
      </div>

      {actionData?.error && (
        <p style={{ color: "#e74c3c", marginTop: "1rem" }}>{actionData.error}</p>
      )}

      {/* Current Livelihoods Section */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "15px",
        padding: "2rem",
        marginTop: "2rem",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
      }}>
        <h2 style={{
          color: "#2c3e50",
          marginBottom: "1.5rem",
          fontSize: "1.5rem",
          fontWeight: "bold"
        }}>Current Livelihood Support Records</h2>
        <div style={{
          display: "grid",
          gap: "1rem"
        }}>
          {livelihoods.map((livelihood: { id: number; participantName: string; Project: { projectName: string } }) => (
            <div 
              key={livelihood.id}
              style={{
                padding: "1rem",
                borderRadius: "8px",
                backgroundColor: "#f8f9fa",
                border: "1px solid #e2e8f0"
              }}
            >
              <p style={{ margin: 0, color: "#2c3e50" }}>
                <strong>{livelihood.participantName}</strong> - {livelihood.Project.projectName}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { ErrorBoundary };
