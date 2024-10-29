import { json, LoaderFunction, ActionFunction } from "@remix-run/node";
import { useLoaderData, Form, useActionData, useNavigation } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { requireUserId, getUser } from "~/utils/session.server";
import { z } from "zod";
import { ErrorBoundary } from "~/components/ErrorBoundary";
import { handleApiError } from "~/utils/apiErrorHandler";
import type { Role, Staff } from "@prisma/client";

type SerializableTeam = {
  id: number;
  name: string;
};

type LoaderData = {
  teams: SerializableTeam[];
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  } | null;
};

type ActionData = {
  errors?: z.ZodIssue[];
  error?: string;
  newTeam?: SerializableTeam;
};

export const teamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
});

export const loader: LoaderFunction = async ({ request }) => {
  await requireUserId(request);
  const user = await getUser(request);
  
  const teams = await db.team.findMany({
    select: {
      id: true,
      name: true,
    }
  });

  const serializedUser = user ? {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  } : null;

  return json<LoaderData>({ 
    teams,
    user: serializedUser
  });
};

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const user = await getUser(request);

  if (user?.role !== "ADMIN") {
    return json<ActionData>({ error: "Not authorized" }, { status: 403 });
  }

  const formData = Object.fromEntries(await request.formData());
  
  try {
    const validatedData = teamSchema.parse(formData);

    const newTeam = await db.team.create({
      data: {
        name: validatedData.name,
        createdById: userId,
      },
      select: {
        id: true,
        name: true,
      }
    });

    return json<ActionData>({ newTeam });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json<ActionData>({ errors: error.errors }, { status: 400 });
    }
    return handleApiError(error);
  }
};

export default function Team() {
  const { teams, user } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();

  return (
    <div>
      <h1>Teams</h1>
      <p>Welcome, {user?.name} ({user?.role})</p>
      {user?.role === "ADMIN" && (
        <Form method="post">
          <div>
            <label htmlFor="name">Team Name:</label>
            <input type="text" id="name" name="name" required />
            {actionData?.errors?.map((error) => (
              error.path[0] === "name" && (
                <p key={error.message} className="error">
                  {error.message}
                </p>
              )
            ))}
          </div>
          <button 
            type="submit" 
            disabled={navigation.state === "submitting"}
          >
            {navigation.state === "submitting" ? "Saving..." : "Add Team"}
          </button>
        </Form>
      )}
      {actionData?.error && <p className="error">{actionData.error}</p>}
      <h2>Current Teams</h2>
      <ul>
        {teams.map((team) => (
          <li key={team.id}>
            {team.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

export { ErrorBoundary };