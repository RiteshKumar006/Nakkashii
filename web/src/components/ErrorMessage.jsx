export default function ErrorMessage({ error }) {
    if (!error) return null;

    return (
        <div className="error">
            <p>{error.message}</p>
            {error.details?.length > 0 && (
                <ul>
                    {error.details.map((d, i) => (
                        <li key={i}>{d.field ? `${d.field}: ` : ""}{d.message}</li>
                    ))}
                </ul>
            )}
        </div>
    );
}
