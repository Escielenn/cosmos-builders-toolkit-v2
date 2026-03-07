import { defineField, defineType } from "sanity";

export default defineType({
  name: "writingPrompt",
  title: "Writing Prompt",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Prompt Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "prompt",
      title: "Prompt Text",
      type: "text",
      rows: 5,
      description: "The writing prompt shown to users. Plain text.",
      validation: (Rule) => Rule.required().max(500),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      options: {
        list: [
          { title: "Worldbuilding", value: "worldbuilding" },
          { title: "Character", value: "character" },
          { title: "Scene", value: "scene" },
          { title: "Dialogue", value: "dialogue" },
          { title: "Theme", value: "theme" },
        ],
      },
      initialValue: "worldbuilding",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "difficulty",
      title: "Difficulty",
      type: "string",
      options: {
        list: [
          { title: "Beginner", value: "beginner" },
          { title: "Intermediate", value: "intermediate" },
          { title: "Advanced", value: "advanced" },
        ],
      },
      initialValue: "beginner",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "wordGoal",
      title: "Word Goal",
      type: "number",
      description: "Suggested word count target for this prompt.",
    }),
    defineField({
      name: "scheduledDate",
      title: "Scheduled Date",
      type: "date",
      description:
        "When set, this prompt becomes the featured prompt for that day.",
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      initialValue: false,
      description:
        "Featured prompts are used as fallbacks when no scheduled prompt exists.",
    }),
  ],
  preview: {
    select: {
      title: "title",
      category: "category",
      scheduledDate: "scheduledDate",
    },
    prepare({ title, category, scheduledDate }) {
      const subtitle = scheduledDate
        ? `${category} · ${scheduledDate}`
        : category;
      return { title, subtitle };
    },
  },
});
