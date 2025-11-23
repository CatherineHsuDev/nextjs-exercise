"use server";

import Event, { IEvent } from "@/database/event.model";
import connectDB from "@/lib/mongodb";

export const getSimilarEventsBySlug = async (slug: string) => {
  try {
    await connectDB();
    const event = await Event.findOne({ slug });

    // find _id must "not be equal to the event above(means the event at current page at top)"
    // definition of similar events: include
    // if the event we are searching for includes any tags that the current page event also has, that must be similar

    // be cautious about return data type, this is a mongoose documents, not plain javascript object
    // add .lean() to transfer into javascript object
    return await Event.find({
      _id: { $ne: event._id },
      tags: { $in: event.tags },
    }).lean<IEvent[]>();
  } catch {
    return [];
  }
};
