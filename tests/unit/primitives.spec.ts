import { expect, test } from "@playwright/test";
import { Button } from "@/components/primitives/Button";
import { EditButton } from "@/components/primitives/EditButton";
import { IconButton } from "@/components/primitives/IconButton";
import { TextInput } from "@/components/primitives/TextInput";
import { RadioGroup } from "@/components/primitives/RadioGroup";

test("caller classes override button layout and styles without dropping other defaults", () => {
  const button = Button({
    variant: "primary",
    className: "w-full px-6 bg-blue-600 hover:bg-blue-700",
  });
  const classes = button.props.className.split(" ");

  expect(classes).toEqual(
    expect.arrayContaining([
      "w-full",
      "px-6",
      "bg-blue-600",
      "hover:bg-blue-700",
      "text-white",
      "py-2",
    ]),
  );
  expect(classes).not.toContain("px-3");
  expect(classes).not.toContain("bg-brand");
  expect(classes).not.toContain("hover:bg-brand-dark");
});

test("edit and icon buttons forward caller classes to Button", () => {
  const edit = EditButton({ children: "編集", onClick: () => {}, className: "w-full bg-blue-50" });
  const icon = IconButton({
    icon: edit.props.icon,
    label: "閉じる",
    onClick: () => {},
    className: "size-10 p-1",
  });

  expect(edit.type).toBe(Button);
  expect(Button(edit.props).props.className.split(" ")).toContain("bg-blue-50");
  expect(Button(edit.props).props.className.split(" ")).not.toContain("bg-indigo-50");
  expect(icon.type).toBe(Button);
  expect(Button(icon.props).props.className.split(" ")).toContain("p-1");
  expect(Button(icon.props).props.className.split(" ")).not.toContain("p-2");
});

test("input defaults remain overridable through className", () => {
  const input = TextInput({
    value: "",
    onChange: () => {},
    className: "w-40 border-blue-500 bg-blue-50",
  });
  const classes = input.props.className.split(" ");

  expect(classes).toEqual(
    expect.arrayContaining(["w-40", "border-blue-500", "bg-blue-50", "rounded-md"]),
  );
  expect(classes).not.toContain("w-full");
  expect(classes).not.toContain("border-stone-300");
  expect(classes).not.toContain("bg-white");
});

test("group className overrides its default layout on the root element", () => {
  const radio = RadioGroup({
    name: "direction",
    value: "",
    options: [],
    onChange: () => {},
    layout: "vertical",
    className: "flex gap-4",
  });
  const classes = radio.props.className.split(" ");

  expect(classes).toEqual(["flex", "gap-4"]);
});
