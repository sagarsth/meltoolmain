import { json, LoaderFunction, ActionFunction } from "@remix-run/node";
import { useLoaderData, Form, useActionData, useNavigation } from "@remix-run/react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { db } from "~/utils/db.server";
import { requireUserId, getUser, createUserSession } from "~/utils/session.server";
import { DatePicker } from "~/components/DatePicker";
import { StatusDropdown } from "~/components/StatusDropdown";
import { projectSchema, ProjectInput } from "~/utils/validationSchemas";
import { useEffect, useState } from "react";
import { format } from 'date-fns';
import "react-datepicker/dist/react-datepicker.css";
import { Status, Project, Team, StrategicObjective } from "@prisma/client";
import { handleApiError } from "~/utils/apiErrorHandler";

export const loader: LoaderFunction = async ({ request }) => {
  try {
    await requireUserId(request);
    const user = await getUser(request);
    const projects = await db.project.findMany({
      include: {
        strategicObjective: true,
        responsibleTeam: true,
      },
    });
    const strategicObjectives = await db.strategicObjective.findMany();
    const teams = await db.team.findMany();
    return json({ projects, strategicObjectives, teams, user });
  } catch (error) {
    return handleApiError(error);
  }
};

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const user = await getUser(request);

  if (user?.role !== "ADMIN") {
    return json({ error: "Not authorized" }, { status: 403 });
  }

  const formData = await request.formData();
  const formDataObject: Record<string, FormDataEntryValue> = {};
  formData.forEach((value, key) => {
    formDataObject[key] = value;
  });
  
  const parsedFormData = {
    ...formDataObject,
    targetValue: formDataObject.targetValue ? parseFloat(formDataObject.targetValue as string) : undefined,
    actualValue: formDataObject.actualValue ? parseFloat(formDataObject.actualValue as string) : undefined,
    teamId: formDataObject.teamId ? parseInt(formDataObject.teamId as string) : undefined,
    strategicObjectiveId: formDataObject.strategicObjectiveId ? parseInt(formDataObject.strategicObjectiveId as string) : undefined,
  };

  const result = projectSchema.safeParse(parsedFormData);

  if (!result.success) {
    return json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const newProject = await db.project.create({
      data: {
        projectName: result.data.name,
        projectObjective: result.data.objective,
        strategicObjectiveId: result.data.strategicObjectiveId,
        projectOutcome: result.data.outcome,
        activity: result.data.activity,
        projectKpi: result.data.kpi,
        targetValue: result.data.targetValue,
        actualValue: result.data.actualValue,
        progressPercentage: (result.data.actualValue / result.data.targetValue) * 100,
        status: result.data.status,
        teamId: result.data.teamId,
        timeline: result.data.timeline,
        lastUpdated: new Date(result.data.lastUpdated),
      },
    });

    return json({ newProject });
  } catch (error) {
    return handleApiError(error);
  }
};

export default function Project() {
  const { projects, teams, strategicObjectives, user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const { control, handleSubmit, reset, formState: { errors } } = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      objective: '',
      strategicObjectiveId: undefined,
      outcome: '',
      activity: '',
      kpi: '',
      targetValue: 0,
      actualValue: 0,
      status: Status.ON_TRACK,
      teamId: undefined,
      timeline: '',
      lastUpdated: format(new Date(), 'yyyy-MM-dd')
    }
  });
  const [imageIndex, setImageIndex] = useState(0);
  const images = [
    "/images/R292592-Gaza-one-year-on-Dr-Fidaa.jpg",
    "/images/R293262-Lebanon-RDFL.jpeg",
    "/images/R275428-1-scaled.jpg",
    "/images/R292592-Gaza-one-year-on-Dr-Fidaa.jpg",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [images.length]);

  const onSubmit = handleSubmit(async (data) => {
    const response = await fetch('/project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      reset();
    }
  });

  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "20px" }}>
      <div style={{ flex: 1, marginRight: "20px", maxHeight: "600px", overflowY: "auto", border: "1px solid #ccc", padding: "20px", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)" }}>
        <h1 style={{ textAlign: "center" }}>Project-Level Tracking</h1>
        <p style={{ textAlign: "center" }}>Welcome, {user?.name} ({user?.role})</p>

        {user?.role === "ADMIN" && (
          <Form method="post" onSubmit={onSubmit}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <div style={{ marginBottom: "20px" }}>
                  <label htmlFor="name">Project Name:</label>
                  <input type="text" id="name" {...field} style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }} />
                  {errors.name && <p className="error" style={{ color: "red" }}>{errors.name.message}</p>}
                </div>
              )}
            />

            <Controller
              name="objective"
              control={control}
              render={({ field }) => (
                <div style={{ marginBottom: "20px" }}>
                  <label htmlFor="objective">Project Objective:</label>
                  <input type="text" id="objective" {...field} style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }} />
                  {errors.objective && <p className="error" style={{ color: "red" }}>{errors.objective.message}</p>}
                </div>
              )}
            />

            <Controller
              name="strategicObjectiveId"
              control={control}
              render={({ field }) => (
                <div style={{ marginBottom: "20px" }}>
                  <label htmlFor="strategicObjectiveId">Strategic Objective:</label>
                  <select id="strategicObjectiveId" {...field} style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }} value={field.value || ""} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}>
                    <option value="">Select a strategic objective</option>
                    {strategicObjectives.map((so: StrategicObjective) => (
                      <option key={so.id} value={so.id}>{so.name}</option>
                    ))}
                  </select>
                  {errors.strategicObjectiveId && <p className="error" style={{ color: "red" }}>{errors.strategicObjectiveId.message}</p>}
                </div>
              )}
            />

            <Controller
              name="outcome"
              control={control}
              render={({ field }) => (
                <div style={{ marginBottom: "20px" }}>
                  <label htmlFor="outcome">Project Outcome:</label>
                  <input type="text" id="outcome" {...field} style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }} />
                  {errors.outcome && <p className="error" style={{ color: "red" }}>{errors.outcome.message}</p>}
                </div>
              )}
            />

            <Controller
              name="activity"
              control={control}
              render={({ field }) => (
                <div style={{ marginBottom: "20px" }}>
                  <label htmlFor="activity">Activity:</label>
                  <textarea id="activity" {...field} style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc", minHeight: "100px" }} />
                  {errors.activity && <p className="error" style={{ color: "red" }}>{errors.activity.message}</p>}
                </div>
              )}
            />

            <Controller
              name="kpi"
              control={control}
              render={({ field }) => (
                <div style={{ marginBottom: "20px" }}>
                  <label htmlFor="kpi">Project-Specific KPI:</label>
                  <input type="text" id="kpi" {...field} style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }} />
                  {errors.kpi && <p className="error" style={{ color: "red" }}>{errors.kpi.message}</p>}
                </div>
              )}
            />

            <Controller
              name="targetValue"
              control={control}
              render={({ field }) => (
                <div style={{ marginBottom: "20px" }}>
                  <label htmlFor="targetValue">Target Value:</label>
                  <input type="number" id="targetValue" {...field} style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                  {errors.targetValue && <p className="error" style={{ color: "red" }}>{errors.targetValue.message}</p>}
                </div>
              )}
            />

            <Controller
              name="actualValue"
              control={control}
              render={({ field }) => (
                <div style={{ marginBottom: "20px" }}>
                  <label htmlFor="actualValue">Actual Value:</label>
                  <input type="number" id="actualValue" {...field} style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                  {errors.actualValue && <p className="error" style={{ color: "red" }}>{errors.actualValue.message}</p>}
                </div>
              )}
            />

            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <div style={{ marginBottom: "20px" }}>
                  <label htmlFor="status">Status:</label>
                  <StatusDropdown id="status" {...field} />
                  {errors.status && <p className="error" style={{ color: "red" }}>{errors.status.message}</p>}
                </div>
              )}
            />

            <Controller
              name="teamId"
              control={control}
              render={({ field }) => (
                <div style={{ marginBottom: "20px" }}>
                  <label htmlFor="teamId">Responsible Team:</label>
                  <select id="teamId" {...field} style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }} value={field.value || ""} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}>
                    <option value="">Select a team</option>
                    {teams.map((team: Team) => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                  {errors.teamId && <p className="error" style={{ color: "red" }}>{errors.teamId.message}</p>}
                </div>
              )}
            />

            <Controller
              name="timeline"
              control={control}
              render={({ field }) => (
                <div style={{ marginBottom: "20px" }}>
                  <label htmlFor="timeline">Timeline:</label>
                  <input type="text" id="timeline" {...field} style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }} placeholder="e.g., Q1-Q4 2024" />
                  {errors.timeline && <p className="error" style={{ color: "red" }}>{errors.timeline.message}</p>}
                </div>
              )}
            />

<Controller
  name="lastUpdated"
  control={control}
  render={({ field }) => (
    <div style={{ marginBottom: "20px" }}>
      <label htmlFor="lastUpdated">Last Updated:</label>
      <DatePicker
        id="lastUpdated"
        name="lastUpdated"
      />
      {errors.lastUpdated && <p className="error" style={{ color: "red" }}>{errors.lastUpdated.message}</p>}
    </div>
  )}
/>

            <button 
              type="submit" 
              disabled={navigation.state === "submitting"}
              style={{ 
                width: "100%", 
                padding: "15px", 
                backgroundColor: "#28a745", 
                color: "white", 
                borderRadius: "5px", 
                border: "none", 
                cursor: "pointer",
                opacity: navigation.state === "submitting" ? 0.7 : 1
              }}
            >
              {navigation.state === "submitting" ? "Saving..." : "Save Project"}
            </button>
          </Form>
        )}

{actionData?.error && (
          <p className="error" style={{
            color: "white", 
            backgroundColor: "#dc3545", 
            textAlign: "center", 
            marginTop: "20px", 
            padding: "10px", 
            borderRadius: "5px",
            boxShadow: "0px 4px 10px rgba(0,0,0,0.1)"
          }}>
            {actionData.error}
          </p>
        )}

        <h2 style={{ marginTop: "40px", color: "#34495e", fontSize: "1.8rem", fontWeight: "600" }}>Current Projects</h2>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {projects.map((project: Project & { strategicObjective: StrategicObjective, responsibleTeam: Team | null }) => (
            <li 
              key={project.id} 
              style={{ 
                marginBottom: "20px", 
                borderBottom: "1px solid #ddd", 
                paddingBottom: "20px", 
                paddingTop: "20px",
                transition: "box-shadow 0.3s ease",
                boxShadow: "0px 4px 8px rgba(0,0,0,0.05)",
                borderRadius: "8px",
                backgroundColor: "#f9f9f9"
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0px 6px 12px rgba(0,0,0,0.1)"}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0px 4px 8px rgba(0,0,0,0.05)"}
            >
              <h3 style={{ color: "#2c3e50", marginBottom: "15px", fontSize: "1.6rem", fontWeight: "500" }}>{project.projectName}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <p style={{ marginBottom: "10px" }}><strong>Objective:</strong> {project.projectObjective}</p>
                  <p style={{ marginBottom: "10px" }}><strong>Strategic Objective:</strong> {project.strategicObjective.name}</p>
                  <p style={{ marginBottom: "10px" }}><strong>Outcome:</strong> {project.projectOutcome}</p>
                  <p style={{ marginBottom: "10px" }}><strong>Activity:</strong> {project.activity}</p>
                  <p style={{ marginBottom: "10px" }}><strong>KPI:</strong> {project.projectKpi}</p>
                </div>
                <div>
                  <p style={{ marginBottom: "10px" }}><strong>Progress:</strong> {project.progressPercentage.toFixed(2)}%</p>
                  <div style={{ 
                    width: "100%", 
                    height: "20px", 
                    backgroundColor: "#e9ecef",
                    borderRadius: "10px",
                    overflow: "hidden",
                    marginTop: "5px",
                    position: "relative"
                  }}>
                    <div style={{
                      width: `${Math.min(project.progressPercentage, 100)}%`,
                      height: "100%",
                      backgroundColor: project.progressPercentage >= 100 ? "#28a745" : "#007bff",
                      transition: "width 0.5s ease, background-color 0.3s ease"
                    }} />
                  </div>
                  <p style={{ marginTop: "15px", marginBottom: "10px" }}>
                    <strong>Status:</strong> <span style={{
                      padding: "5px 10px",
                      borderRadius: "6px",
                      backgroundColor: 
                        project.status === "ON_TRACK" ? "#28a745" :
                        project.status === "AT_RISK" ? "#ffc107" :
                        project.status === "DELAYED" ? "#dc3545" :
                        project.status === "COMPLETED" ? "#6c757d" : "#6c757d",
                      color: "white",
                      fontSize: "1em"
                    }}>{project.status}</span>
                  </p>
                  <p style={{ marginBottom: "10px" }}><strong>Responsible Team:</strong> {project.responsibleTeam?.name || 'Not assigned'}</p>
                  <p style={{ marginBottom: "10px" }}><strong>Timeline:</strong> {project.timeline}</p>
                  <p><strong>Last Updated:</strong> {new Date(project.lastUpdated).toLocaleDateString()}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div style={{ flexBasis: "40%", position: "relative", display: "flex", flexDirection: "column", justifyContent: "flex-start", paddingTop: "20px" }}>
        <div style={{ position: "sticky", top: "20px", borderRadius: "8px", overflow: "hidden", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)" }}>
          <img
            src={images[imageIndex]}
            alt={`Project visual ${imageIndex + 1}`}
            style={{ width: "100%", height: "auto", display: "block", transition: "opacity 0.5s ease-in-out" }}
          />
          <div style={{ position: "absolute", bottom: "10px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "8px" }}>
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setImageIndex(idx)}
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: idx === imageIndex ? "#fff" : "rgba(255, 255, 255, 0.5)",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  transition: "background-color 0.3s ease"
                }}
                aria-label={`Go to image ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import { ErrorBoundary } from '~/components/ErrorBoundary';

export { ErrorBoundary };
 