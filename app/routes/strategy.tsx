import { json, LoaderFunction, ActionFunction } from "@remix-run/node";
import { useLoaderData, Form, useActionData, useNavigation } from "@remix-run/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { db } from "~/utils/db.server";
import { requireUserId, getUser } from "~/utils/session.server";
import { DatePicker } from "~/components/DatePicker";
import { StatusDropdown } from "~/components/StatusDropdown";
import { strategicObjectiveSchema, StrategicObjectiveInput } from "~/utils/validationSchemas";
import { ErrorBoundary } from "~/components/ErrorBoundary";
import { handleApiError } from "~/utils/apiErrorHandler";
import { format } from 'date-fns';
import { z } from "zod";
import type { Status, Team, StrategicObjective } from "@prisma/client";


// Interface for your error handling
interface ZodError {
  errors: Array<{ path: string[]; message: string }>;
}

export const loader: LoaderFunction = async ({ request }) => {
  try {
    await requireUserId(request);
    const user = await getUser(request);
    const strategicObjectives = await db.strategicObjective.findMany({
      include: { responsibleTeam: true },
    });
    const teams = await db.team.findMany();
    return json({ strategicObjectives, teams, user });
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
  };

  try {
    const validatedData = strategicObjectiveSchema.parse(parsedFormData);

    const newStrategicObjective = await db.strategicObjective.create({
      data: {
        name: validatedData.name,
        outcome: validatedData.outcome,
        kpi: validatedData.kpi,
        targetValue: validatedData.targetValue,
        actualValue: validatedData.actualValue,
        status: validatedData.status,
        teamId: validatedData.teamId,
        lastUpdated: new Date(validatedData.lastUpdated),
        progressPercentage: (validatedData.actualValue / validatedData.targetValue) * 100,
      },
    });

    return json({ newStrategicObjective });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return json({ errors: error.errors }, { status: 400 });
    }
    console.error('Unexpected error:', error);
    return json({ error: "An unexpected error occurred" }, { status: 500 });
  }
};

export default function Strategy() {
  const { strategicObjectives, teams, user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  interface FormData {
    name: string;
    outcome: string;
    kpi: string;
    targetValue: number;
    actualValue: number;
    status: Status;
    teamId?: number;
    lastUpdated: string;
  }

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<FormData>({
    resolver: zodResolver(strategicObjectiveSchema),
    defaultValues: {
      name: '',
      outcome: '',
      kpi: '',
      targetValue: 0,
      actualValue: 0,
      status: 'ON_TRACK' as Status,
      teamId: undefined,
      lastUpdated: format(new Date(), 'yyyy-MM-dd')
    }
  });

  const onSubmit = handleSubmit(async (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });

    const response = await fetch('/strategy', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      reset();
    }
  });

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ marginBottom: "20px" }}>Strategic Objectives</h1>
      <p>Welcome, {user?.name} ({user?.role})</p>

      {user?.role === "ADMIN" && (
        <Form method="post" onSubmit={onSubmit} style={{ maxWidth: "600px", margin: "20px 0" }}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <div style={{ marginBottom: "20px" }}>
                <label htmlFor="name">Strategic Objective Name:</label>
                <input 
                  type="text" 
                  id="name" 
                  {...field} 
                  style={{ 
                    width: "100%", 
                    padding: "8px", 
                    marginTop: "5px", 
                    borderRadius: "4px", 
                    border: "1px solid #ccc" 
                  }} 
                />
                {errors.name && <p style={{ color: "red", marginTop: "5px" }}>{errors.name.message}</p>}
              </div>
            )}
          />

          <Controller
            name="outcome"
            control={control}
            render={({ field }) => (
              <div style={{ marginBottom: "20px" }}>
                <label htmlFor="outcome">Outcome:</label>
                <input 
                  type="text" 
                  id="outcome" 
                  {...field} 
                  style={{ 
                    width: "100%", 
                    padding: "8px", 
                    marginTop: "5px", 
                    borderRadius: "4px", 
                    border: "1px solid #ccc" 
                  }} 
                />
                {errors.outcome && <p style={{ color: "red", marginTop: "5px" }}>{errors.outcome.message}</p>}
              </div>
            )}
          />

          <Controller
            name="kpi"
            control={control}
            render={({ field }) => (
              <div style={{ marginBottom: "20px" }}>
                <label htmlFor="kpi">Key Performance Indicator:</label>
                <input 
                  type="text" 
                  id="kpi" 
                  {...field} 
                  style={{ 
                    width: "100%", 
                    padding: "8px", 
                    marginTop: "5px", 
                    borderRadius: "4px", 
                    border: "1px solid #ccc" 
                  }} 
                />
                {errors.kpi && <p style={{ color: "red", marginTop: "5px" }}>{errors.kpi.message}</p>}
              </div>
            )}
          />

          <Controller
            name="targetValue"
            control={control}
            render={({ field }) => (
              <div style={{ marginBottom: "20px" }}>
                <label htmlFor="targetValue">Target Value:</label>
                <input 
                  type="number" 
                  id="targetValue" 
                  {...field} 
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  style={{ 
                    width: "100%", 
                    padding: "8px", 
                    marginTop: "5px", 
                    borderRadius: "4px", 
                    border: "1px solid #ccc" 
                  }} 
                />
                {errors.targetValue && <p style={{ color: "red", marginTop: "5px" }}>{errors.targetValue.message}</p>}
              </div>
            )}
          />

          <Controller
            name="actualValue"
            control={control}
            render={({ field }) => (
              <div style={{ marginBottom: "20px" }}>
                <label htmlFor="actualValue">Actual Value:</label>
                <input 
                  type="number" 
                  id="actualValue" 
                  {...field} 
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  style={{ 
                    width: "100%", 
                    padding: "8px", 
                    marginTop: "5px", 
                    borderRadius: "4px", 
                    border: "1px solid #ccc" 
                  }} 
                />
                {errors.actualValue && <p style={{ color: "red", marginTop: "5px" }}>{errors.actualValue.message}</p>}
              </div>
            )}
          />

<Controller
  name="status"
  control={control}
  render={({ field }) => (
    <div style={{ marginBottom: "20px" }}>
      <label htmlFor="status">Status:</label>
      <StatusDropdown 
        id="status" 
        name={field.name}
        value={field.value}
        onChange={(value: Status) => field.onChange(value)}
        onBlur={field.onBlur}
      />
      {errors.status && <p style={{ color: "red", marginTop: "5px" }}>{errors.status.message}</p>}
    </div>
  )}
/>

          <Controller
            name="teamId"
            control={control}
            render={({ field }) => (
              <div style={{ marginBottom: "20px" }}>
                <label htmlFor="teamId">Team:</label>
                <select 
                  id="teamId" 
                  {...field}
                  value={field.value || ""}
                  onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  style={{ 
                    width: "100%", 
                    padding: "8px", 
                    marginTop: "5px", 
                    borderRadius: "4px", 
                    border: "1px solid #ccc" 
                  }}
                >
                  <option value="">Select a team</option>
                  {teams.map((team: Team) => (
    <option key={team.id} value={team.id}>{team.name}</option>
  ))}
                </select>
                {errors.teamId && <p style={{ color: "red", marginTop: "5px" }}>{errors.teamId.message}</p>}
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
                {errors.lastUpdated && <p style={{ color: "red", marginTop: "5px" }}>{errors.lastUpdated.message}</p>}
              </div>
            )}
          />

          <button 
            type="submit" 
            disabled={navigation.state === "submitting"}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "#0066cc",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: navigation.state === "submitting" ? "not-allowed" : "pointer",
              opacity: navigation.state === "submitting" ? 0.7 : 1
            }}
          >
            {navigation.state === "submitting" ? "Saving..." : "Save Strategic Objective"}
          </button>
        </Form>
      )}

      {actionData?.error && <p style={{ color: "red", marginTop: "20px" }}>{actionData.error}</p>}

      <h2 style={{ marginTop: "40px" }}>Current Strategic Objectives</h2>
      <div style={{ display: "grid", gap: "20px", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
      {strategicObjectives.map((so: StrategicObjective & { responsibleTeam: Team }) => (
    <div 
      key={so.id} 
      style={{ 
        padding: "20px", 
        border: "1px solid #ccc", 
        borderRadius: "8px",
        backgroundColor: "white",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}
    >
      <h3 style={{ marginBottom: "10px" }}>{so.name}</h3>
      <p><strong>Outcome:</strong> {so.outcome}</p>
      <p><strong>KPI:</strong> {so.kpi}</p>
      <p><strong>Progress:</strong> {(so.actualValue / so.targetValue * 100).toFixed(2)}%</p>
      <div style={{ 
        width: "100%", 
        height: "10px", 
        backgroundColor: "#f0f0f0", 
        borderRadius: "5px",
        overflow: "hidden",
        marginTop: "5px"
      }}>
        <div style={{
          width: `${Math.min((so.actualValue / so.targetValue * 100), 100)}%`,
          height: "100%",
          backgroundColor: "#0066cc",
          transition: "width 0.3s ease"
        }} />
      </div>
      <p><strong>Status:</strong> {so.status}</p>
      <p><strong>Team:</strong> {so.responsibleTeam.name}</p>
      <p><strong>Last Updated:</strong> {new Date(so.lastUpdated).toLocaleDateString()}</p>
    </div>
  ))}
      </div>
    </div>
  );
}

export { ErrorBoundary };