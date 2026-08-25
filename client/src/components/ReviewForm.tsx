import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "@/contexts/LocaleContext";
import { getReviewCopy } from "@/lib/reviewCopy";

interface ReviewFormProps {
  productId: number;
}

export default function ReviewForm({ productId }: ReviewFormProps) {
  const { locale } = useLocale();
  const copy = getReviewCopy(locale);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rating || !name || !email || !comment) {
      toast.error(copy.fillAll);
      return;
    }

    if (!email.includes("@")) {
      toast.error(copy.validEmail);
      return;
    }

    setIsSubmitting(true);

    // Simuler l'envoi du formulaire
    setTimeout(() => {
      console.log("Avis soumis:", {
        productId,
        rating,
        name,
        email,
        comment,
      });

      toast.success(copy.moderation);

      // Réinitialiser le formulaire
      setRating(0);
      setName("");
      setEmail("");
      setComment("");
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <Card className="border-2 border-gray-200">
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              {copy.rating}
            </label>
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i + 1)}
                  onMouseEnter={() => setHoverRating(i + 1)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                  aria-label={`${copy.rating} : ${i + 1}/5`}
                >
                  <Star
                    className={`h-8 w-8 ${
                      (hoverRating || rating) > i
                        ? "fill-orange-500 text-orange-500"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                {rating === 1 && copy.bad}
                {rating === 2 && copy.average}
                {rating === 3 && copy.good}
                {rating === 4 && copy.veryGood}
                {rating === 5 && copy.excellent}
              </p>
            )}
          </div>

          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-800 mb-2">
              {copy.name}
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={copy.enterName}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-2">
              {copy.email}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre.email@exemple.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Comment Textarea */}
          <div>
            <label htmlFor="comment" className="block text-sm font-semibold text-gray-800 mb-2">
              {copy.review}
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={copy.shareExperience}
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {comment.length}/500 {copy.characters}
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 font-semibold text-lg"
          >
            {isSubmitting ? copy.submitting : copy.publish}
          </Button>

          {/* Info Message */}
          <p className="text-xs text-gray-600 text-center">
            {copy.moderation}
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
