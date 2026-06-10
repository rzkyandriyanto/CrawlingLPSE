import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { UserModel } from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const { id, session_token } = await req.json();

    if (!id || !session_token) {
      return NextResponse.json({ valid: false, error: "Missing parameters" }, { status: 400 });
    }

    await connectToDatabase();

    const user = await UserModel.findById(id);

    if (!user) {
      return NextResponse.json({ valid: false, error: "User not found" }, { status: 404 });
    }

    if (user.session_token !== session_token) {
      return NextResponse.json({ valid: false, error: "Session invalid" }, { status: 401 });
    }

    return NextResponse.json({ valid: true }, { status: 200 });

  } catch (error: any) {
    console.error("Verify Session Error:", error);
    return NextResponse.json({ valid: false, error: "Server error" }, { status: 500 });
  }
}
