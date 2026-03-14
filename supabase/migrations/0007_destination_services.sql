-- Migration: Add Destination Services capabilities

-- 1. Create the destination_services table
CREATE TABLE public.destination_services (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    destination_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    price_amount numeric(10, 2) NOT NULL CHECK (price_amount >= 0),
    service_type text NOT NULL DEFAULT 'standard' CHECK (service_type IN ('standard', 'package', 'discounted')),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT destination_services_pkey PRIMARY KEY (id),
    CONSTRAINT destination_services_destination_id_fkey FOREIGN KEY (destination_id) REFERENCES public.destinations(id) ON DELETE CASCADE
);

-- 2. Add service tracking to bookings
ALTER TABLE public.bookings
ADD COLUMN service_id uuid DEFAULT NULL,
ADD COLUMN service_snapshot jsonb DEFAULT NULL;

ALTER TABLE public.bookings
ADD CONSTRAINT bookings_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.destination_services(id) ON DELETE SET NULL;

-- 3. Relax price constraint on destinations since it's now service-driven (optional back-compat)
ALTER TABLE public.destinations
ALTER COLUMN price_amount DROP NOT NULL;

-- 4. Enable RLS for Services
ALTER TABLE public.destination_services ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies for Services
CREATE POLICY "Enable public read access for active services" ON public.destination_services
    FOR SELECT USING (is_active = true);

CREATE POLICY "Enable all access for assigned staff" ON public.destination_services
    FOR ALL USING (
        destination_id IN (
            SELECT id FROM public.destinations WHERE staff_id = auth.uid()
        )
    );

CREATE POLICY "Enable all access for assigned service staff" ON public.destination_services
    FOR ALL USING (
        destination_id IN (
            SELECT id FROM public.destinations WHERE staff_id = auth.uid()
        )
    ) WITH CHECK (
        destination_id IN (
            SELECT id FROM public.destinations WHERE staff_id = auth.uid()
        )
    );

-- 6. Grant privileges
GRANT ALL ON TABLE public.destination_services TO authenticated;
GRANT ALL ON TABLE public.destination_services TO service_role;
GRANT SELECT ON TABLE public.destination_services TO anon;
