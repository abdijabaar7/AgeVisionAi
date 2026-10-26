// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AgeVisionApp from "@/components/age-vision-app";

describe("photo consent and result flow", () => {
  beforeEach(() => {
    localStorage.clear();
    URL.createObjectURL = vi.fn(() => "blob:local-preview");
    URL.revokeObjectURL = vi.fn();
  });
  afterEach(() => vi.restoreAllMocks());

  it("does not submit before consent and renders the returned midpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, result: { ageRange: { low: 20, high: 28 }, approximateMidpoint: 24 } }) });
    vi.stubGlobal("fetch", fetchMock);
    render(<AgeVisionApp maxUploadMb={5} />);

    const image = new File([Uint8Array.from([0xff, 0xd8, 0xff, 0x01])], "face.jpg", { type: "image/jpeg" });
    fireEvent.change(screen.getByLabelText("Dooro sawir"), { target: { files: [image] } });
    const submit = screen.getByRole("button", { name: /Qiyaas da'yda|Qiyaas da/i });
    expect((submit as HTMLButtonElement).disabled).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(submit);
    expect(await screen.findByText("24", { selector: ".big-age" })).toBeTruthy();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/estimate-age");
  });
});
