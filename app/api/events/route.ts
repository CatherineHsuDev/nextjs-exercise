import { Event } from "@/database";
import connectDB from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export async function POST(req: NextRequest) {
  try {
    // connect to db
    await connectDB();

    // get access to form data.
    // same to req.body in express.js
    const formData = await req.formData();

    // use "let event" to store data that is going to be parsed from form data
    let event;
    // use try catch block to catch parse errors
    try {
      // .fromEntries is to get all keys and value pairs and transfer into and object
      event = Object.fromEntries(formData.entries());
    } catch (e) {
      return NextResponse.json(
        { message: "Invalid JSON data format" },
        { status: 400 }
      );
    }

    // get uploaded image file
    const file = formData.get("image") as File;

    // if no file is received
    if (!file)
      return NextResponse.json(
        { message: "Image file is required" },
        { status: 400 }
      );

    // "['cloud']" --> ["cloud", "devops"]
    let tags = JSON.parse(formData.get("tags") as string);
    let agenda = JSON.parse(formData.get("agenda") as string);

    // convert image to byte array (other data type cannot be stored)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // https://cloudinary.com/documentation/nextjs_image_component_tutorial?utm_source=chatgpt.com
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { resource_type: "image", folder: "DevEvent" },
          (error, results) => {
            if (error) return reject(error);

            resolve(results);
          }
        )
        .end(buffer);
    });

    // to ensure it is a secure url
    event.image = (uploadResult as { secure_url: string }).secure_url;

    // Event is a schema created in db setting
    // const createdEvent = await Event.create(event);
    const createdEvent = await Event.create({
      ...event,
      tags: tags,
      agenda: agenda,
    });

    return NextResponse.json(
      { message: "Event created successfully", event: createdEvent },
      { status: 201 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        message: "Event Creation Failed",
        error: e instanceof Error ? e.message : "Unknown",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // connect to db
    await connectDB();

    // find in cluster "Event", sort({ createdAt: -1 }); means new event will show at the top
    const events = await Event.find().sort({ createdAt: -1 });

    return NextResponse.json(
      { message: "Events fetched successfully", events },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json(
      { message: "Event fetching failed", error: e },
      { status: 500 }
    );
  }
}

// a route that accepts a slug as input > return the even details
