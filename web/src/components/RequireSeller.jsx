import { Fragment } from "react";
import { useAuth } from "../context/AuthContext";

export default function RequireSeller({ children }) {
    const { user } = useAuth();

    if (user?.role !== "seller") {
        return <p className="notice">Log in as a seller from the menu at the top to manage products.</p>;
    }

    // key makes the page start fresh when the seller changes, no old data or errors
    return <Fragment key={user.id}>{children}</Fragment>;
}
