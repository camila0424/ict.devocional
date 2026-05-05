export default function DevotionalDayPage({ params }: { params: { day: string } }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-bold">Devocional día {params.day}</h1>
    </div>
  );
}
