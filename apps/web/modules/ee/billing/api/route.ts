import { NextResponse } from "next/server";

export const POST = async (request: Request): Promise<Response> => {
  return NextResponse.json({ message: "Billing is not available" }, { status: 200 });
};
