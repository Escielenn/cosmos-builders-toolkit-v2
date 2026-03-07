import { defineField, defineType } from "sanity";

export default defineType({
  name: "course",
  title: "Course",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 4,
      validation: (Rule) => Rule.required().max(500),
    }),
    defineField({
      name: "artwork",
      title: "Artwork",
      type: "image",
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: "alt",
          type: "string",
          title: "Alternative Text",
        },
      ],
    }),
    defineField({
      name: "instructor",
      title: "Instructor",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "registrationUrl",
      title: "Registration URL",
      type: "url",
      description: "External link to ISMythology.com or Jbatt.com",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "startDate",
      title: "Start Date",
      type: "date",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "duration",
      title: "Duration",
      type: "string",
      description: 'e.g., "6 weeks", "8 sessions", "Self-paced"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "price",
      title: "Price",
      type: "string",
      description: 'Display string, e.g., "$199", "Free"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      initialValue: false,
      description: "Featured courses appear on the Pricing page",
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "Upcoming", value: "upcoming" },
          { title: "Enrolling", value: "enrolling" },
          { title: "In Progress", value: "in_progress" },
          { title: "Completed", value: "completed" },
        ],
      },
      initialValue: "upcoming",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "proMonthlyDiscount",
      title: "Pro Monthly Discount",
      type: "string",
      description: 'e.g., "5% off"',
      group: "discounts",
    }),
    defineField({
      name: "proYearlyDiscount",
      title: "Pro Annual Discount",
      type: "string",
      description: 'e.g., "10% off"',
      group: "discounts",
    }),
    defineField({
      name: "vanguardMonthlyDiscount",
      title: "Vanguard Monthly Discount",
      type: "string",
      description: 'e.g., "10% off"',
      group: "discounts",
    }),
    defineField({
      name: "vanguardYearlyDiscount",
      title: "Vanguard Annual Discount",
      type: "string",
      description: 'e.g., "25% off"',
      group: "discounts",
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
      options: {
        layout: "tags",
        list: [
          { title: "Worldbuilding", value: "worldbuilding" },
          { title: "Science Fiction", value: "science-fiction" },
          { title: "Astrobiology", value: "astrobiology" },
          { title: "Planet Design", value: "planet-design" },
          { title: "Alien Life", value: "alien-life" },
          { title: "Civilizations", value: "civilizations" },
          { title: "Writing Craft", value: "writing-craft" },
          { title: "Environmental Cascade", value: "environmental-cascade" },
        ],
      },
    }),
  ],
  groups: [
    {
      name: "discounts",
      title: "Member Discounts",
    },
  ],
  preview: {
    select: {
      title: "title",
      instructor: "instructor",
      status: "status",
      media: "artwork",
    },
    prepare({ title, instructor, status, media }) {
      const statusLabel =
        {
          upcoming: "Upcoming",
          enrolling: "Enrolling",
          in_progress: "In Progress",
          completed: "Completed",
        }[status as string] || status;
      return {
        title,
        subtitle: `${instructor} — ${statusLabel}`,
        media,
      };
    },
  },
});
