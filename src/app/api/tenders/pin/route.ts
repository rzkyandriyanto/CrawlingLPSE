import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { TenderModel } from "@/models/Tender";

export async function POST(req: NextRequest) {
  try {
    const { userId, tenderId, action } = await req.json();

    if (!userId || !tenderId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectToDatabase();

    if (action === "pin") {
      await TenderModel.updateOne(
        { lelangId: tenderId },
        { $addToSet: { pinned_by_users: userId } }
      );
    } else if (action === "unpin") {
      await TenderModel.updateOne(
        { lelangId: tenderId },
        { $pull: { pinned_by_users: userId } }
      );
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Pin Tender API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
