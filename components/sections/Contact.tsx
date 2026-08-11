"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle, CircleNotch } from "@phosphor-icons/react";
import { contact, site } from "@/lib/content";

type Status = "idle" | "sending" | "sent" | "error";
type FieldErrors = Partial<Record<"name" | "email" | "message", string>>;

/**
 * Contact split.
 *
 * Full interaction cycle: idle, inline validation errors, sending, success, submit
 * failure. Labels sit above inputs, helper text is present in markup, error text sits
 * below its input. No placeholder-as-label anywhere.
 *
 * Placeholders use --fg-muted rather than --fg-subtle so they clear AA in both themes
 * (5.96:1 light, 5.87:1 dark).
 */
export function Contact() {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<FieldErrors>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();

    const next: FieldErrors = {};
    if (!name) next.name = contact.form.errors.name;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = contact.form.errors.email;
    if (message.length < 8) next.message = contact.form.errors.message;

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setStatus("sending");
    try {
      const res = await fetch("/api/contato", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          company: String(data.get("company") ?? "").trim(),
          message,
        }),
      });
      if (!res.ok) throw new Error("request failed");
      setStatus("sent");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  const fieldClass =
    "w-full border border-line-strong bg-transparent px-4 py-3 text-fg placeholder:text-fg-muted transition-colors duration-200 focus:border-accent focus:outline-none";

  return (
    <section id="contato" className="border-t border-line py-24 sm:py-32">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-14 px-5 sm:px-8 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <h2 className="text-4xl font-medium tracking-[-0.02em] text-fg sm:text-5xl lg:text-6xl">
            {contact.headline}
          </h2>
          <p className="mt-7 max-w-[42ch] leading-relaxed text-fg-muted">
            {contact.lead}
          </p>

          <ul className="mt-10 flex flex-wrap gap-3">
            {contact.social.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-block rounded-control border border-line-strong px-5 py-2.5 text-sm text-fg transition-colors duration-200 hover:border-fg"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>

          <p className="mt-10 font-mono text-sm text-fg-muted">{site.domain}</p>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          {status === "sent" ? (
            <div
              role="status"
              className="flex items-start gap-3 border border-line-strong p-8"
            >
              <CheckCircle
                size={24}
                weight="regular"
                className="mt-0.5 shrink-0 text-accent-text"
              />
              <p className="text-lg text-fg">{contact.form.success}</p>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="grid gap-6">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium text-fg">
                  {contact.form.name.label}
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder={contact.form.name.placeholder}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "name-erro" : undefined}
                  className={fieldClass}
                />
                {errors.name ? (
                  <p id="name-erro" className="text-sm text-accent-text">
                    {errors.name}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label htmlFor="email" className="text-sm font-medium text-fg">
                    {contact.form.email.label}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder={contact.form.email.placeholder}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "email-erro" : undefined}
                    className={fieldClass}
                  />
                  {errors.email ? (
                    <p id="email-erro" className="text-sm text-accent-text">
                      {errors.email}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-2">
                  <label htmlFor="company" className="text-sm font-medium text-fg">
                    {contact.form.company.label}
                  </label>
                  <input
                    id="company"
                    name="company"
                    type="text"
                    autoComplete="organization"
                    placeholder={contact.form.company.placeholder}
                    className={fieldClass}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label htmlFor="message" className="text-sm font-medium text-fg">
                  {contact.form.message.label}
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  placeholder={contact.form.message.placeholder}
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={
                    errors.message ? "message-erro" : "message-ajuda"
                  }
                  className={`${fieldClass} resize-y`}
                />
                {errors.message ? (
                  <p id="message-erro" className="text-sm text-accent-text">
                    {errors.message}
                  </p>
                ) : (
                  <p id="message-ajuda" className="text-sm text-fg-muted">
                    {contact.form.message.helper}
                  </p>
                )}
              </div>

              {status === "error" ? (
                <p role="alert" className="text-sm text-accent-text">
                  {contact.form.errors.submit}
                </p>
              ) : null}

              <div>
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="group inline-flex items-center gap-2 rounded-control bg-accent px-7 py-3.5 font-medium text-accent-on transition-[background-color,transform] duration-200 hover:bg-accent-hover active:scale-[0.98] disabled:opacity-70"
                >
                  <span className="whitespace-nowrap">
                    {status === "sending" ? contact.form.sending : contact.form.submit}
                  </span>
                  {status === "sending" ? (
                    <CircleNotch size={17} weight="regular" className="animate-spin" />
                  ) : (
                    <ArrowRight
                      size={17}
                      weight="regular"
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
