// @vitest-environment jsdom

import React from "react";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DestinationStatusActions } from "@/components/forms/destination-status-actions";
import { ListingForm } from "@/components/forms/listing-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn()
  })
}));

describe("destination status UI", () => {
  it("does not expose a duplicate status selector when editing an existing destination", () => {
    render(
      <ListingForm
        destinationId="dest_123"
        defaultValues={{
          title: "Sample destination",
          summary: "A unique destination summary.",
          description: "This is a full destination description for testing.",
          locationText: "Barangay Test",
          category: "tour",
          bookingType: "online",
          status: "draft",
          inclusions: "",
          policies: "",
          featured: false
        }}
        submitLabel="Save destination"
      />
    );

    expect(screen.queryByRole("combobox", { name: /status/i })).not.toBeInTheDocument();
  });

  it("shows the dedicated destination status controls", () => {
    render(<DestinationStatusActions destinationId="dest_123" currentStatus="draft" />);

    expect(screen.getByRole("button", { name: /draft/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /publish/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /archive/i })).toBeInTheDocument();
  });
});
