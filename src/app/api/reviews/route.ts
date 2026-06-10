import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { ReviewModel } from "@/models/Review";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");
    
    if (!itemId) {
      return NextResponse.json({ error: "itemId required" }, { status: 400 });
    }

    await connectToDatabase();
    
    const reviews = await ReviewModel.find({ itemId }).sort({ rating: -1, createdAt: -1 });
    return NextResponse.json({ reviews }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { itemId, itemType, userId, userName, userAvatar, rating, comment, parentId } = body;
    
    if (!itemId || !userName || !comment) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (!parentId && !rating) {
      return NextResponse.json({ error: "Rating required for main review" }, { status: 400 });
    }

    await connectToDatabase();
    
    const newReview = await ReviewModel.create({
      itemId, itemType, userId, userName, userAvatar: userAvatar || null, rating: rating || 5, comment, parentId: parentId || null
    });
    
    return NextResponse.json({ review: newReview }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { _id, rating, comment, userId, userName } = body;
    
    if (!_id || !comment) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await connectToDatabase();
    
    const existing = await ReviewModel.findById(_id);
    if (!existing) return NextResponse.json({ error: "Review not found" }, { status: 404 });
    
    if ((userId && existing.userId && existing.userId !== String(userId)) && (userName && existing.userName !== userName)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (rating) existing.rating = rating;
    existing.comment = comment;
    await existing.save();
    
    return NextResponse.json({ review: existing }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const _id = searchParams.get("_id");
    const userId = searchParams.get("userId");
    const userName = searchParams.get("userName");
    
    if (!_id) {
      return NextResponse.json({ error: "_id required" }, { status: 400 });
    }

    await connectToDatabase();
    
    const existing = await ReviewModel.findById(_id);
    if (!existing) return NextResponse.json({ error: "Review not found" }, { status: 404 });
    
    if ((userId && existing.userId && existing.userId !== String(userId)) && (userName && existing.userName !== userName)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if it has replies
    const hasReplies = await ReviewModel.exists({ parentId: _id });
    if (hasReplies) {
      // Soft delete
      existing.isDeleted = true;
      await existing.save();
    } else {
      // Hard delete if it has no children
      await ReviewModel.findByIdAndDelete(_id);
    }
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { _id, userId } = body;
    
    if (!_id || !userId) {
      return NextResponse.json({ error: "Missing _id or userId" }, { status: 400 });
    }

    await connectToDatabase();
    
    const existing = await ReviewModel.findById(_id);
    if (!existing) return NextResponse.json({ error: "Review not found" }, { status: 404 });
    
    const stringUserId = String(userId);
    const likeIndex = existing.likes ? existing.likes.indexOf(stringUserId) : -1;
    
    if (likeIndex > -1) {
      // Unlike
      existing.likes.splice(likeIndex, 1);
    } else {
      // Like
      if (!existing.likes) existing.likes = [];
      existing.likes.push(stringUserId);
    }
    
    await existing.save();
    
    return NextResponse.json({ review: existing }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
